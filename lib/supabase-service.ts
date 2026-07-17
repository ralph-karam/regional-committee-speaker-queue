import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { createInitialState } from "@/lib/default-state";
import { normalizeQueueState } from "@/lib/state-normalizer";
import { localQueueService, QueueDataService } from "@/lib/storage-service";
import { QueueState } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const meetingId = process.env.NEXT_PUBLIC_SUPABASE_MEETING_ID || "regional-committee";

let client: SupabaseClient | undefined;

function getClient() {
  if (!supabaseUrl || !supabaseAnonKey) return undefined;
  client ??= createClient(supabaseUrl, supabaseAnonKey);
  return client;
}

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseQueueService: QueueDataService = {
  mode: "supabase",
  async load() {
    const supabase = getClient();
    if (!supabase) return localQueueService.load();

    const { data, error } = await supabase.from("meetings").select("state").eq("id", meetingId).maybeSingle();
    if (error) {
      console.error("Supabase load failed", error);
      return localQueueService.load();
    }

    if (!data?.state) {
      const initial = createInitialState();
      await this.save(initial);
      return initial;
    }

    return normalizeQueueState(data.state as QueueState);
  },
  async save(state) {
    const supabase = getClient();
    if (!supabase) {
      localQueueService.save(state);
      return;
    }

    const { error } = await supabase.from("meetings").upsert({
      id: meetingId,
      state,
      updated_at: new Date().toISOString()
    });
    if (error) console.error("Supabase save failed", error);
  },
  async clear() {
    const initial = createInitialState();
    await this.save(initial);
  },
  subscribe(onState) {
    const supabase = getClient();
    if (!supabase) return () => {};

    let channel: RealtimeChannel | undefined;
    channel = supabase
      .channel(`meeting-state-${meetingId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetings", filter: `id=eq.${meetingId}` },
        (payload) => {
          const next = payload.new as { state?: QueueState } | undefined;
          if (next?.state) onState(normalizeQueueState(next.state));
        }
      )
      .subscribe();

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }
};

export const activeQueueService = supabaseConfigured ? supabaseQueueService : localQueueService;
