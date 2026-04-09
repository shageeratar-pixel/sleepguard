import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function ProfileSetupModal() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const profileQuery = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.saveCallerUserProfile({
        name: name.trim() || "User",
        email: email.trim(),
        consentToTracking: true,
        consentToResearch: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["mySessions"] });
    },
  });

  const isAuthenticated = !!identity;
  const profileLoading = actorFetching || profileQuery.isLoading;
  const isFetched = !!actor && profileQuery.isFetched;
  const showSetup =
    isAuthenticated &&
    !profileLoading &&
    isFetched &&
    profileQuery.data === null;

  return (
    <Dialog open={showSetup} data-ocid="profile_setup.dialog">
      <DialogContent
        className="max-w-md"
        style={{
          background: "oklch(0.13 0.03 255)",
          border: "1px solid oklch(0.22 0.04 255)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-display gradient-text">
            Welcome to SleepGuard
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set up your profile to start monitoring your sleep health.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="profile-name" className="text-foreground">
              Your Name
            </Label>
            <Input
              id="profile-name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              style={{
                background: "oklch(0.17 0.025 255)",
                borderColor: "oklch(0.22 0.04 255)",
              }}
              data-ocid="profile_setup.name.input"
            />
          </div>
          <div>
            <Label htmlFor="profile-email" className="text-foreground">
              Email (optional)
            </Label>
            <Input
              id="profile-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              style={{
                background: "oklch(0.17 0.025 255)",
                borderColor: "oklch(0.22 0.04 255)",
              }}
              data-ocid="profile_setup.email.input"
            />
          </div>
          <div
            className="p-3 rounded-lg"
            style={{ background: "oklch(0.17 0.025 255)" }}
          >
            <p className="text-xs text-muted-foreground">
              ⚕️ SleepGuard uses your microphone and optional camera to monitor
              sleep patterns. All data is encrypted and stored privately on the
              Internet Computer blockchain.
            </p>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !name.trim()}
            className="w-full font-semibold"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.58 0.22 278), oklch(0.68 0.18 278))",
              color: "white",
            }}
            data-ocid="profile_setup.submit.button"
          >
            {saveMutation.isPending ? "Saving..." : "Get Started"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
