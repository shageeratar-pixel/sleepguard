import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  // Sleep session state
  type SleepSessionId = Nat;
  var nextSleepSessionId : SleepSessionId = 0;

  // SensorData represents a single sensor reading at a timestamp
  type SensorData = {
    timestamp : Int; // Relative to session start
    hr : Float;
    hrv : Float;
    spo2 : Float;
    movement : Float;
  };

  // RiskAssessment represents calculated risk percentages for session
  type RiskAssessment = {
    sleepApnea : Float;
    insomnia : Float;
    rbd : Float;
  };

  // SleepSession represents a single sleep tracking session
  type SleepSession = {
    id : SleepSessionId;
    user : Principal;
    startTimestamp : Time.Time;
    durationMinutes : Float;
    sleepScore : Float;
    sensorReadings : [SensorData];
    riskAssessment : ?RiskAssessment;
    notes : Text;
  };

  // UserProfile stores consent and user info
  type UserProfile = {
    name : Text;
    email : Text;
    consentToTracking : Bool;
    consentToResearch : Bool;
  };

  module SleepSession {
    public func compare(session1 : SleepSession, session2 : SleepSession) : Order.Order {
      Int.compare(session1.id, session2.id);
    };
  };

  module SensorData {
    public func compare(sensorData1 : SensorData, sensorData2 : SensorData) : Order.Order {
      Int.compare(sensorData1.timestamp, sensorData2.timestamp);
    };
  };

  // Persistent storage
  let userProfiles = Map.empty<Principal, UserProfile>();
  let sleepSessionStore = Map.empty<Principal, Map.Map<SleepSessionId, SleepSession>>();

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // File upload storage
  type SleepRecordingId = Text;
  let sleepRecordings = Map.empty<SleepRecordingId, Storage.ExternalBlob>();

  include MixinStorage();

  // Persist user profile with consent flags
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Get current user's profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.get(caller);
  };

  // Get any user's profile (admin can view any, users can only view their own)
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Create a new sleep session
  public shared ({ caller }) func startSession(session : SleepSession) : async SleepSessionId {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can start sleep sessions");
    };

    let id = nextSleepSessionId;
    nextSleepSessionId += 1;

    let newSession : SleepSession = {
      id;
      user = caller;
      startTimestamp = Time.now();
      durationMinutes = session.durationMinutes;
      sleepScore = session.sleepScore;
      sensorReadings = session.sensorReadings.sort(); // Sort by timestamp
      riskAssessment = session.riskAssessment;
      notes = session.notes;
    };

    var userSessionMap = switch (sleepSessionStore.get(caller)) {
      case (null) {
        let map = Map.empty<SleepSessionId, SleepSession>();
        map.add(id, newSession);
        map;
      };
      case (?existing) {
        existing.add(id, newSession);
        existing;
      };
    };
    sleepSessionStore.add(caller, userSessionMap);

    id;
  };

  // Finish session (should update duration, score, etc.)
  public shared ({ caller }) func finishSession(id : Nat, finalData : SleepSession) : async SleepSessionId {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can finish sleep sessions");
    };

    // Look up session
    switch (sleepSessionStore.get(caller)) {
      case (null) { Runtime.trap("No sleep sessions found for user") };
      case (?userSessionMap) {
        switch (userSessionMap.get(id)) {
          case (null) { Runtime.trap("Sleep session not found") };
          case (?existingSession) {
            let finalizedSession : SleepSession = {
              id = existingSession.id;
              user = caller;
              startTimestamp = existingSession.startTimestamp;
              durationMinutes = finalData.durationMinutes;
              sleepScore = finalData.sleepScore;
              sensorReadings = finalData.sensorReadings.sort();
              riskAssessment = finalData.riskAssessment;
              notes = finalData.notes;
            };
            userSessionMap.add(id, finalizedSession);
          };
        };
      };
    };
    id;
  };

  // Add sensor reading to a session
  public shared ({ caller }) func addSensorReading(sessionId : SleepSessionId, reading : SensorData) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add data");
    };

    // Lookup
    switch (sleepSessionStore.get(caller)) {
      case (null) { Runtime.trap("No sleep sessions for user") };
      case (?userSessionMap) {
        switch (userSessionMap.get(sessionId)) {
          case (null) { Runtime.trap("Session not found") };
          case (?session) {
            let updatedSession : SleepSession = {
              session with
              sensorReadings = session.sensorReadings.concat([reading]);
            };
            userSessionMap.add(sessionId, updatedSession);
          };
        };
      };
    };
  };

  // Add risk score
  public shared ({ caller }) func addRiskAssessment(sessionId : SleepSessionId, assessment : RiskAssessment) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add data");
    };

    switch (sleepSessionStore.get(caller)) {
      case (null) { Runtime.trap("No sleep sessions for user") };
      case (?userSessionMap) {
        switch (userSessionMap.get(sessionId)) {
          case (null) { Runtime.trap("Session not found") };
          case (?session) {
            let updatedSession : SleepSession = {
              session with
              riskAssessment = ?assessment;
            };
            userSessionMap.add(sessionId, updatedSession);
          };
        };
      };
    };
  };

  // Get all sleep sessions for caller
  public query ({ caller }) func getMySessions() : async [SleepSession] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view sessions");
    };
    switch (sleepSessionStore.get(caller)) {
      case (null) { [] };
      case (?sessionMap) { sessionMap.values().toArray().sort() };
    };
  };

  // Get specific session
  public query ({ caller }) func getCallerSession(sessionId : SleepSessionId) : async ?SleepSession {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view sessions");
    };
    switch (sleepSessionStore.get(caller)) {
      case (null) { null };
      case (?sessionMap) { sessionMap.get(sessionId) };
    };
  };

  // Upload a sleep recording
  public shared ({ caller }) func uploadRecording(id : SleepRecordingId, recording : Storage.ExternalBlob) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can upload recordings");
    };
    sleepRecordings.add(id, recording);
  };

  // Get recording
  public query ({ caller }) func getRecording(id : SleepRecordingId) : async ?Storage.ExternalBlob {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view recordings");
    };
    sleepRecordings.get(id);
  };

  // Get all user recordings
  public shared ({ caller }) func getMyRecordings(ids : [SleepRecordingId]) : async [Storage.ExternalBlob] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view recordings");
    };
    ids.map(func(id) { switch (sleepRecordings.get(id)) { case (null) { Runtime.trap("Recording not found") }; case (?recording) { recording } } });
  };

  // Delete all account data
  public shared ({ caller }) func deleteMyData() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete their data");
    };
    userProfiles.remove(caller);
    sleepSessionStore.remove(caller);
  };
};
