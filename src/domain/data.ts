import type {
  ConceptNode,
  GraphEdge,
  RoadmapStep,
  Track,
  UserProfile,
} from "@/domain/types";

/**
 * Demo corpus. Every "citation" points at the mock ingest sources uploaded
 * for the demo persona so that explanations stay grounded in the user's
 * own artifacts (see AGENTS.md — product invariants).
 */

export const USER_PROFILE: UserProfile = {
  name: "Saumit",
  email: "saumit@epistemic-os.demo",
  initials: "S",
};

export const TRACKS: Track[] = [
  {
    id: "ds",
    name: "Distributed Systems",
    domain: "Replication & consensus",
    domainCodename: "RPC/LOG/QUORUM",
    progress: 46,
    milestonesDone: 2,
    milestonesTotal: 5,
    status: "active",
    ready: true,
  },
  {
    id: "db",
    name: "Database Internals",
    domain: "Storage engines",
    domainCodename: "B-TREE/LSM/BUFFER",
    progress: 38,
    milestonesDone: 2,
    milestonesTotal: 6,
    status: "idle",
    ready: false,
  },
  {
    id: "types",
    name: "Type Systems",
    domain: "Inference & generics",
    domainCodename: "HINDLEY-M/UNIFY",
    progress: 24,
    milestonesDone: 1,
    milestonesTotal: 4,
    status: "idle",
    ready: false,
  },
];

export const ROADMAP_STEPS: RoadmapStep[] = [
  {
    index: 1,
    title: "Append-Only Logs & WAL",
    subtitle: "Durability and append ordering",
    conceptIds: ["wal", "pridb"],
    seedStatus: "mastered",
  },
  {
    index: 2,
    title: "In-Memory Key-Value & SSTables",
    subtitle: "LSM engine primitives",
    conceptIds: ["sstables"],
    seedStatus: "mastered",
  },
  {
    index: 3,
    title: "State Machine Replication",
    subtitle: "Deterministic replay over agreed logs",
    conceptIds: ["smr"],
    seedStatus: "current",
  },
  {
    index: 4,
    title: "Leader Election & Heartbeats",
    subtitle: "Fencing a single coordinator",
    conceptIds: ["ldr"],
    seedStatus: "next",
  },
  {
    index: 5,
    title: "Raft & Paxos Consensus",
    subtitle: "Agreement under partial failure",
    conceptIds: ["raft", "paxos"],
    seedStatus: "locked",
  },
];

export const CONCEPT_NODES: ConceptNode[] = [
  {
    id: "wal",
    label: "Write-Ahead Log",
    codename: "PostgreSQL WAL",
    tier: 1,
    familiarity: "mastered",
    mastery: 1,
    blurb:
      "Durable, ordered append-only record of mutations. Streams from your Postgres project notes and the storage-engine bookmark set.",
    prereqIds: [],
    analogy: {
      anchorId: "pridb",
      anchorTitle: "PostgreSQL Primary–Replica Replication",
      anchorSource: "notes/db-internals.md · §7 replication",
      targetTitle: "Write-Ahead Log mechanics",
      targetSource: "notes/db-internals.md · §7.2 WAL anatomy",
      summary:
        "This one is already yours: the WAL is the spine your primary uses to make replicas converge.",
      mapping: [
        {
          from: "Sequential fsync'd append",
          to: "An LSN-ordered mutation history",
          note: "Every replay decision is made possible by the strictly increasing LSN you rely on today.",
        },
        {
          from: "Crash recovery replays WAL",
          to: "Durable prefix defines the truth",
          note: "The buffer pool can lie; the log cannot. That trust boundary is re-used by every replication scheme you will learn.",
        },
      ],
      delta: [
        {
          title: "Order without randomness",
          body: "WAL entries must replay deterministically — timestamps or randomness sneak nondeterminism into replicas.",
        },
      ],
    },
  },
  {
    id: "pridb",
    label: "Primary-Replica DB",
    codename: "primary ↔ replica",
    tier: 1,
    familiarity: "mastered",
    mastery: 1,
    blurb:
      "Single writable primary shipping changes to read replicas — you run this setup in the hobby-postgres project.",
    prereqIds: [],
  },
  {
    id: "eventloop",
    label: "Event Loop",
    codename: "Node.js event loop",
    tier: 1,
    familiarity: "mastered",
    mastery: 1,
    blurb:
      "Single-threaded task queue from your backend services; the anchor for any 'single arrow of time' reasoning.",
    prereqIds: [],
  },
  {
    id: "sstables",
    label: "In-Memory KV & SSTables",
    codename: "memtable → SSTable",
    tier: 2,
    familiarity: "mastered",
    mastery: 1,
    blurb:
      "Immutable sorted runs, compaction, bloom filters — straight out of your Bitcask/LSM reading notes.",
    prereqIds: [],
  },
  {
    id: "smr",
    label: "State Machine Replication",
    codename: "RSM · dsm.md",
    tier: 3,
    familiarity: "emerging",
    mastery: 0.6,
    blurb:
      "Replicas apply the same deterministic commands in the same order. Currently mid-scaffold: 60% after last session.",
    prereqIds: ["wal", "sstables"],
    analogy: {
      anchorId: "pridb",
      anchorTitle: "PostgreSQL Primary–Replica Replication",
      anchorSource: "notes/db-internals.md · §7 replication",
      targetTitle: "Deterministic State Machine Replication",
      targetSource: "notes/ds-notes.md · RSM sketch & margins",
      summary:
        "Your primary–replica setup is already a replication pipeline — SMR's claim is that any replica applying the same ordered command log lands in exactly the same state.",
      mapping: [
        {
          from: "Ordered WAL append",
          to: "Ordered replicated log (apply index)",
          note: "Primary appends LSN-ordered WAL records; SMR demands every replica agree on one global log order before applying.",
        },
        {
          from: "Primary alone decides write order",
          to: "Quorum agrees on the log first",
          note: "In Postgres the primary is trusted by construction; SMR removes that trust and adds an agreement step.",
        },
        {
          from: "Replica replays WAL asynchronously",
          to: "Replica applies the log deterministically",
          note: "Same replay contract you know, upgraded: no wall clocks, no randomness, identical byte state.",
        },
      ],
      delta: [
        {
          title: "Agreement precedes application",
          body: "You apply the primary's WAL because primary = source of truth. In SMR, replicas must first agree that a log entry exists at position i.",
        },
        {
          title: "Failover needs an agreed cut",
          body: "Promoting a replica means agreeing on the last applied entry and fencing the old primary — no silent split-brain.",
        },
      ],
    },
  },
  {
    id: "vector",
    label: "Vector Clocks",
    codename: "VC · happens-before",
    tier: 3,
    familiarity: "emerging",
    mastery: 0.35,
    blurb:
      "Per-writer counters capturing causality. Partially studied via the CRDT bookmark cluster.",
    prereqIds: [],
    analogy: {
      anchorId: "eventloop",
      anchorTitle: "Node.js Event Loop Task Ordering",
      anchorSource: "notes/node-concurrency.md · §2",
      targetTitle: "Vector Clocks (causal ordering)",
      targetSource: "bookmarks/crdt-cluster · klein & birman survey",
      summary:
        "A vector clock is your event loop's queue made explicit across machines: ordering becomes data instead of an implicit scheduler guarantee.",
      mapping: [
        {
          from: "Per-task FIFO queue",
          to: "Per-process sequence counter",
          note: "Each writer maintains its own monotonically increasing counter, like the FIFO index of its queue.",
        },
        {
          from: "await serializes callbacks",
          to: "Happens-before edges order events",
          note: "Awaiting a promise is you declaring happens-before; vector clocks record the same thing explicitly.",
        },
        {
          from: "Two timers racing with no await",
          to: "Incomparable entries = concurrent writes",
          note: "When neither counter dominates, the events raced — exactly your unawaited-callback race, now visible in data.",
        },
      ],
      delta: [
        {
          title: "Detection, not resolution",
          body: "A vector clock tells you that a key was written concurrently; it never merges values — the merge policy stays yours.",
        },
        {
          title: "Clock size grows with writers",
          body: "One slot per participant forever — pruning strategies become necessary at scale.",
        },
      ],
    },
  },
  {
    id: "ldr",
    label: "Leader Election & Heartbeats",
    codename: "elect · lease·hb",
    tier: 4,
    familiarity: "emerging",
    mastery: 0.15,
    blurb:
      "Selecting exactly one coordinator and detecting its liveness through timeouts.",
    prereqIds: ["smr"],
    analogy: {
      anchorId: "eventloop",
      anchorTitle: "Node.js Event Loop",
      anchorSource: "notes/node-concurrency.md · §1",
      targetTitle: "Leader Election & Heartbeats",
      targetSource: "notes/ds-notes.md · election napkin sketch",
      summary:
        "You already trust one loop to serialize work. Distributed systems need a protocol to elect exactly one loop and notice when it stops breathing.",
      mapping: [
        {
          from: "One event loop serializes work",
          to: "One leader owns ordering per term",
          note: "Same invariant — single active coordinator — but now achieved by election rather than by process architecture.",
        },
        {
          from: "Event loop ticks unconditionally",
          to: "Heartbeats prove liveness",
          note: "Followers start an election when the leader's heartbeat renewal window lapses.",
        },
      ],
      delta: [
        {
          title: "Consensus on the leader, too",
          body: "An event loop cannot be duplicated; a network partition can produce two leaders, so terms/votes fence stale ones.",
        },
      ],
    },
  },
  {
    id: "raft",
    label: "Raft Consensus",
    codename: "Raft · raft.pdf",
    tier: 5,
    familiarity: "uncharted",
    mastery: 0,
    blurb:
      "Understandable consensus: leader election + log replication + safety. Locked behind SMR and elections scaffold.",
    prereqIds: ["smr", "ldr"],
    analogy: {
      anchorId: "wal",
      anchorTitle: "PostgreSQL WAL",
      anchorSource: "notes/db-internals.md · §7.2 WAL anatomy",
      targetTitle: "Raft Log Replication",
      targetSource: "bookmarks/raft-cluster · raft.github.io viz notes",
      summary:
        "Raft is your WAL wearing a safety harness: the append-only log you already trust becomes the artifact the whole cluster must agree on.",
      mapping: [
        {
          from: "Append-only WAL with monotonically increasing LSN",
          to: "Raft log entries with (term, index)",
          note: "Your LSN ordering intuition maps 1:1; the extra term coordinate exists to fence stale leaders.",
        },
        {
          from: "Primary writes WAL replicas wait on",
          to: "Leader replicates entries, quorum acks",
          note: "Instead of shipping to replay-only followers, followers ack before the entry counts as committed.",
        },
        {
          from: "Crash → promote replica, replay to LSN",
          to: "Leader crash → election on freshest log",
          note: "Same goal (never lose durable entries), different mechanism (voting is a log-length comparison).",
        },
      ],
      delta: [
        {
          title: "Commit needs quorum, not just fsync",
          body: "Your WAL entry is durable the instant its fsync lands on the primary. Raft needs a majority ack before a commit index advances.",
        },
        {
          title: "Terms fence stale leaders",
          body: "Any message from an old term is refused — the analogy breaks exactly where single-primary intuition stops.",
        },
        {
          title: "Election chooses log length",
          body: "Voting favors the most up-to-date candidate, preserving the WAL-prefix property you rely on for crash recovery.",
        },
      ],
    },
  },
  {
    id: "paxos",
    label: "Paxos Consensus",
    codename: "Paxos · ballot#",
    tier: 5,
    familiarity: "uncharted",
    mastery: 0,
    blurb:
      "The ancestral consensus protocol — prepare/accept rounds under ballot numbers.",
    prereqIds: ["smr", "vector"],
    analogy: {
      anchorId: "pridb",
      anchorTitle: "PostgreSQL Primary–Replica Replication",
      anchorSource: "notes/db-internals.md · §7 replication",
      targetTitle: "Paxos (prepare/accept rounds)",
      targetSource: "bookmarks/raft-cluster · paxos-made-simple notes",
      summary:
        "Every round of Paxos borrows your primary's powers (decide order, fence old truth) but splits them across messengers to survive any single failure.",
      mapping: [
        {
          from: "Primary grants itself write authority",
          to: "Proposers must win a majority prepare",
          note: "Authority is negotiated per slot instead of being a role.",
        },
        {
          from: "Promotion fences the old primary",
          to: "Higher ballot numbers overrule lower ones",
          note: "The fencing you do manually at failover becomes a numeric rule inside the protocol.",
        },
      ],
      delta: [
        {
          title: "Two-phase, message-driven",
          body: "Prepare/promise and accept/accepted replace the unconditional authority your primary has.",
        },
        {
          title: "Slots without global order",
          body: "Paxos orders one slot at a time; Multi-Paxos reuses a stable leader to steal back your WAL-like global order.",
        },
      ],
    },
  },
  {
    id: "bft",
    label: "Byzantine Fault Tolerance",
    codename: "BFT · f-adversary",
    tier: 5,
    familiarity: "uncharted",
    mastery: 0,
    blurb:
      "Consensus sustaining arbitrary faults — signed messages, 3f+1 replicas.",
    prereqIds: ["raft", "vector"],
    analogy: {
      anchorId: "pridb",
      anchorTitle: "PostgreSQL Primary–Replica Replication",
      anchorSource: "notes/db-internals.md · §7 replication",
      targetTitle: "Byzantine Fault Tolerance",
      targetSource: "bookmarks/bft-cluster ·.pbft primer",
      summary:
        "Crash faults (replicas dying) versus Byzantine faults (replicas lying): your replication guild-book assumes everyone is honest.",
      mapping: [
        {
          from: "Replica crash → lag & replay",
          to: "Byzantine replica → contradictory statements",
          note: "Assume malicious behavior; craft and verify signed messages.",
        },
        {
          from: "Majority of healthy replicas trusted",
          to: "Quorum intersection proves truth (3f+1)",
          note: "Duplicated replicas no longer suffice: you need 3f+1 to tolerate f liars.",
        },
      ],
      delta: [
        {
          title: "Lies, not crashes",
          body: "Every message must carry a signature and a proof; quorum intersection makes contradictory certificates impossible.",
        },
        {
          title: "Faster f, heavier f",
          body: "Message count grows sharply with more replicas; watch out for scalability trade-offs.",
        },
      ],
    },
  },
];

export const CONCEPT_EDGES: GraphEdge[] = [
  // mastered anchors into the current frontier
  { id: "e1", source: "wal", target: "smr", relation: "prerequisite_for" },
  { id: "e2", source: "sstables", target: "smr", relation: "prerequisite_for" },
  { id: "e3", source: "pridb", target: "smr", relation: "analogous_to" },
  { id: "e4", source: "wal", target: "pridb", relation: "subsystem_of" },
  { id: "e5", source: "sstables", target: "pridb", relation: "subsystem_of" },
  { id: "e6", source: "eventloop", target: "ldr", relation: "analogous_to" },
  // frontier climbs to consensus
  { id: "e7", source: "smr", target: "ldr", relation: "prerequisite_for" },
  { id: "e8", source: "smr", target: "raft", relation: "prerequisite_for" },
  { id: "e9", source: "ldr", target: "raft", relation: "prerequisite_for" },
  { id: "e10", source: "vector", target: "raft", relation: "prerequisite_for" },
  { id: "e11", source: "smr", target: "paxos", relation: "prerequisite_for" },
  { id: "e12", source: "vector", target: "paxos", relation: "prerequisite_for" },
  { id: "e13", source: "raft", target: "bft", relation: "prerequisite_for" },
  { id: "e14", source: "vector", target: "bft", relation: "prerequisite_for" },
  // implements / structural edges
  { id: "e15", source: "raft", target: "smr", relation: "implements" },
  { id: "e16", source: "paxos", target: "smr", relation: "implements" },
  { id: "e17", source: "ldr", target: "raft", relation: "subsystem_of" },
];

/** Curated topological layout (normalized 0..1). Client-only rendering. */
export const INITIAL_POSITIONS: Record<string, { x: number; y: number }> = {
  wal: { x: 0.1, y: 0.2 },
  pridb: { x: 0.07, y: 0.44 },
  eventloop: { x: 0.05, y: 0.72 },
  sstables: { x: 0.29, y: 0.12 },
  smr: { x: 0.42, y: 0.4 },
  vector: { x: 0.33, y: 0.68 },
  ldr: { x: 0.6, y: 0.6 },
  raft: { x: 0.8, y: 0.38 },
  paxos: { x: 0.84, y: 0.68 },
  bft: { x: 0.93, y: 0.16 },
};

/** Keyword routing for "bridge a concept" chat queries. */
export const BRIDGE_KEYWORDS: { conceptId: string; keywords: string[] }[] = [
  { conceptId: "raft", keywords: ["raft"] },
  { conceptId: "bft", keywords: ["byzantine", "bft"] },
  { conceptId: "paxos", keywords: ["paxos"] },
  { conceptId: "ldr", keywords: ["leader", "election", "heartbeat"] },
  { conceptId: "smr", keywords: ["state machine", "replication", "rsm"] },
  { conceptId: "vector", keywords: ["vector", "clock", "causal"] },
  { conceptId: "wal", keywords: ["wal", "write-ahead", "write ahead"] },
  { conceptId: "sstables", keywords: ["sstable", "lsm", "memtable", "bloom"] },
  { conceptId: "pridb", keywords: ["primary", "replica db", "postgres"] },
  { conceptId: "eventloop", keywords: ["event loop"] },
];

/** Seeded concepts that note ingestion can extract. */
export const NOTE_SEEDS: {
  keys: string[];
  node: Omit<ConceptNode, "analogy">;
  anchorId: string;
  relation: GraphEdge["relation"];
}[] = [
  {
    keys: ["crdt", "conflict", "merge"],
    node: {
      id: "crdt",
      label: "CRDTs",
      codename: "CRDT · merge fn",
      tier: 6,
      familiarity: "uncharted",
      mastery: 0,
      blurb:
        "Convergence without coordination: merge commutation from your CRDT bookmark cluster.",
      prereqIds: ["vector"],
    },
    anchorId: "vector",
    relation: "analogous_to",
  },
  {
    keys: ["gossip", "rumor", "epidemic"],
    node: {
      id: "gossip",
      label: "Gossip Protocol",
      codename: "gossip · fanout",
      tier: 6,
      familiarity: "uncharted",
      mastery: 0,
      blurb: "Epidemic broadcast for cluster state updates.",
      prereqIds: [],
    },
    anchorId: "ldr",
    relation: "analogous_to",
  },
  {
    keys: ["merkle", "audit", "hash tree"],
    node: {
      id: "merkle",
      label: "Merkle Tree",
      codename: "merkle · σhash",
      tier: 6,
      familiarity: "uncharted",
      mastery: 0,
      blurb: "Hash tree for verifiable range comparisons; audit-log bookmark.",
      prereqIds: ["sstables"],
    },
    anchorId: "sstables",
    relation: "subsystem_of",
  },
  {
    keys: ["two-phase", "2pc", "commit protocol"],
    node: {
      id: "2pc",
      label: "Two-Phase Commit",
      codename: "2PC · PREPARED",
      tier: 6,
      familiarity: "uncharted",
      mastery: 0,
      blurb: "Atomic commit coordination across resources; xact notes.",
      prereqIds: ["wal"],
    },
    anchorId: "wal",
    relation: "implements",
  },
  {
    keys: ["lease", "leasing"],
    node: {
      id: "leases",
      label: "Leases",
      codename: "lease · ttl window",
      tier: 6,
      familiarity: "uncharted",
      mastery: 0,
      blurb: "Time-bounded authority for fencing interim leaders.",
      prereqIds: ["ldr"],
    },
    anchorId: "ldr",
    relation: "implements",
  },
];
