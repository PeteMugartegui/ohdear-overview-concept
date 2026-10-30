import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ArrowLeft,
  Award,
  Bell,
  BellOff,
  ChevronDown,
  CircleDashed,
  Clock,
  FileText,
  Flag,
  Gauge,
  Globe,
  History,
  Info,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  PanelTop,
  Settings,
  ShieldBan,
  ShieldCheck,
  Unlink,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  CHECK_LABEL,
  CHECKS,
  counts,
  LAST_CHECKED,
  presence,
  type CheckId,
  type Phase,
  type Presence,
} from "./model";
import { PerformanceTrend, UptimeTimeline } from "./visuals";

type ScopeDialog = { kind: "scope"; title: string };
type DetailDialog = { kind: "detail"; id: CheckId };
type ActiveDialog = ScopeDialog | DetailDialog | null;

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  check?: CheckId;
  scope?: boolean;
};

const NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "uptime", label: "Uptime", icon: Clock, check: "uptime" },
  { id: "certificate", label: "Certificate health", icon: ShieldCheck, check: "certificate" },
  { id: "broken-links", label: "Broken links", icon: Unlink, check: "broken-links" },
  { id: "mixed-content", label: "Mixed content", icon: Layers, check: "mixed-content" },
  { id: "lighthouse", label: "Lighthouse", icon: Gauge, check: "lighthouse" },
  { id: "dns", label: "DNS", icon: List, check: "dns" },
  { id: "domain", label: "Domain", icon: Flag, check: "domain" },
  { id: "blocklist", label: "DNS blocklist", icon: ShieldBan, check: "blocklist" },
  { id: "reports", label: "Monthly reports", icon: FileText, scope: true },
  { id: "runs", label: "Run History", icon: History, scope: true },
  { id: "snooze", label: "Snooze History", icon: BellOff, scope: true },
  { id: "notifications", label: "Notifications", icon: Bell, scope: true },
  { id: "maintenance", label: "Maintenance periods", icon: Wrench, scope: true },
  { id: "badges", label: "Badges", icon: Award, scope: true },
  { id: "settings", label: "Settings", icon: Settings, scope: true },
];

const SCOPE_BODY =
  "This prototype only covers the deuxphoto.com overview: whether initial checks are still running, what needs attention, and where to look next.";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function OverviewApp() {
  const [phase, setPhase] = useState<Phase>("complete");
  const [sample, setSample] = useState(true);
  const [tab, setTab] = useState<"active" | "disabled">("active");
  const [dialog, setDialog] = useState<ActiveDialog>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [pendingScroll, setPendingScroll] = useState<CheckId | "top" | null>(null);
  const tally = counts(phase);

  useEffect(() => {
    if (!pendingScroll) return;
    const behavior = prefersReducedMotion() ? "auto" : "smooth";
    if (pendingScroll === "top") {
      document.getElementById("monitoring-summary")?.scrollIntoView({ behavior, block: "start" });
    } else {
      const node = document.getElementById(`check-${pendingScroll}`);
      node?.scrollIntoView({ behavior, block: "center" });
      node?.focus();
    }
    setPendingScroll(null);
  }, [pendingScroll, tab, phase]);

  function openScope(title: string) {
    setMobileNav(false);
    setDialog({ kind: "scope", title });
  }

  function openDetail(id: CheckId) {
    setDialog({ kind: "detail", id });
  }

  function goToCheck(id: CheckId) {
    setTab("active");
    setMobileNav(false);
    setPendingScroll(id);
  }

  function goToTop() {
    setTab("active");
    setMobileNav(false);
    setPendingScroll("top");
  }

  return (
    <div className="min-h-screen bg-canvas text-fg" data-phase={phase} data-sample={sample ? "on" : "off"}>
      <a
        href="#monitoring-summary"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to monitoring summary
      </a>
      <PrototypeToolbar phase={phase} sample={sample} onPhase={setPhase} onSample={setSample} />
      <div className="bg-grid">
        <TrialBanner onPlan={() => openScope("Choose a plan")} />
        <TopNav onStatus={() => openScope("Status pages")} onAccount={openScope} />
        <main className="px-3 pb-20 md:px-5">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-xl border border-line bg-surface">
            <SiteHeader phase={phase} onBack={() => openScope("Monitors")} />
            <div className="md:flex">
              <Sidebar
                onOverview={goToTop}
                onCheck={goToCheck}
                onScope={openScope}
                onOpenMobile={() => setMobileNav(true)}
              />
              <div className="min-w-0 flex-1 border-t border-line md:border-t-0 md:border-l">
                <Board
                  phase={phase}
                  sample={sample}
                  tab={tab}
                  tally={tally}
                  onTab={setTab}
                  onOpen={openDetail}
                  onScope={openScope}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
      <button
        type="button"
        aria-label="Support chat"
        onClick={() => openScope("Support chat")}
        className="fixed right-4 bottom-4 z-30 inline-flex size-14 items-center justify-center rounded-full bg-brand text-on-brand shadow-pop"
      >
        <MessageCircle className="size-6" aria-hidden="true" />
      </button>
      <MobileNav
        open={mobileNav}
        onOpenChange={setMobileNav}
        onOverview={goToTop}
        onCheck={goToCheck}
        onScope={openScope}
      />
      <InfoDialog dialog={dialog} phase={phase} sample={sample} onOpenChange={(open) => !open && setDialog(null)} />
    </div>
  );
}

function PrototypeToolbar({
  phase,
  sample,
  onPhase,
  onSample,
}: {
  phase: Phase;
  sample: boolean;
  onPhase: (phase: Phase) => void;
  onSample: (sample: boolean) => void;
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-line bg-toolbar text-toolbar-ink">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 md:px-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide uppercase">Preview state</p>
          <p className="text-xs text-toolbar-muted">Demonstration only. Not an Oh Dear feature.</p>
        </div>
        <div role="radiogroup" aria-label="Preview state" className="flex flex-wrap gap-1 rounded-full bg-toolbar-chip p-1">
          <StateRadio
            checked={phase === "running"}
            label="Initial checks running"
            onSelect={() => onPhase("running")}
          />
          <StateRadio checked={phase === "complete"} label="Checks complete" onSelect={() => onPhase("complete")} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span id="sample-history-label" className="text-sm font-medium">
            Sample data
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={sample}
            aria-labelledby="sample-history-label"
            onClick={() => onSample(!sample)}
            className={cn(
              "relative h-11 w-16 shrink-0 rounded-full",
              sample ? "bg-toolbar-ink" : "bg-toolbar-track",
            )}
          >
            <span
              className={cn(
                "absolute top-1 left-1 size-9 rounded-full bg-toolbar-chip transition-transform",
                sample && "translate-x-5",
              )}
            />
            <span className="sr-only">{sample ? "Sample data on" : "Sample data off"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function StateRadio({
  checked,
  label,
  onSelect,
}: {
  checked: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "min-h-11 rounded-full px-3 text-sm font-medium",
        checked ? "bg-toolbar-ink text-toolbar" : "text-toolbar-ink hover:bg-toolbar",
      )}
    >
      {label}
    </button>
  );
}

function TrialBanner({ onPlan }: { onPlan: () => void }) {
  return (
    <div className="bg-banner px-4 py-2 text-center text-sm text-banner-fg">
      <p>
        <Info className="mr-1 inline size-4 align-text-bottom" aria-hidden="true" />
        10 days left in your free trial. Happy with what you see?{" "}
        <button type="button" onClick={onPlan} className="font-medium underline underline-offset-2">
          Choose a plan
        </button>{" "}
        to keep monitoring after Nov 9.
      </p>
    </div>
  );
}

function TopNav({
  onStatus,
  onAccount,
}: {
  onStatus: () => void;
  onAccount: (title: string) => void;
}) {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 md:px-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-6">
        <img src="/oh-dear-logo.png" alt="Oh Dear" className="h-10 w-auto" />
        <nav aria-label="Product" className="flex items-center gap-2">
          <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-raised px-3 text-xs font-semibold tracking-wide text-fg uppercase">
            <Globe className="size-4 text-brand" aria-hidden="true" />
            Monitors
          </span>
          <button
            type="button"
            onClick={onStatus}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-xs font-semibold tracking-wide text-muted uppercase hover:bg-raised hover:text-fg"
          >
            <PanelTop className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Status pages</span>
            <span className="sr-only sm:hidden">Status pages</span>
          </button>
        </nav>
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-raised pr-3 pl-1 text-xs font-semibold tracking-wide uppercase"
          >
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-inset text-xs text-fg">
              PM
            </span>
            <span className="hidden sm:inline">Pedro Mugartegui</span>
            <ChevronDown className="size-4 text-muted" aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-50 min-w-52 rounded-lg border border-line bg-surface p-1 text-fg shadow-pop"
          >
            <p className="px-3 py-2 text-sm text-muted">Pedro Mugartegui</p>
            {["Account settings", "Billing", "Sign out"].map((item) => (
              <MenuItem key={item} onSelect={() => onAccount(item)}>
                {item}
              </MenuItem>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  );
}

function SiteHeader({ phase, onBack }: { phase: Phase; onBack: () => void }) {
  return (
    <div className="relative z-20 border-b border-line px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center gap-1 justify-self-start text-xs font-medium tracking-wide text-muted uppercase hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to monitors
        </button>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <SiteMark phase={phase} />
            <h1 className="text-base font-semibold">deuxphoto.com</h1>
          </div>
        </div>
      </div>
    </div>
  );
}

function SiteMark({ phase }: { phase: Phase }) {
  const running = phase === "running";
  const text = running
    ? "1 issue found so far: 1 broken link. Performance is still being checked."
    : "2 issues found: 1 broken link and performance.";
  return (
    <span className="group relative -my-2 inline-flex">
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-full"
        aria-label={text}
      >
        <span className="size-2.5 rounded-full bg-warn" aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 z-30 mt-1 w-56 -translate-x-1/2 rounded-lg border border-line bg-raised px-3 py-2 text-left text-xs font-normal tracking-normal text-fg normal-case opacity-0 shadow-pop group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

function Sidebar({
  onOverview,
  onCheck,
  onScope,
  onOpenMobile,
}: {
  onOverview: () => void;
  onCheck: (id: CheckId) => void;
  onScope: (title: string) => void;
  onOpenMobile: () => void;
}) {
  return (
    <>
      <div className="border-b border-line p-3 md:hidden">
        <button
          type="button"
          onClick={onOpenMobile}
          className="flex min-h-11 w-full items-center justify-between rounded-lg bg-raised px-3 text-sm"
        >
          <span className="inline-flex items-center gap-2">
            <LayoutGrid className="size-4 text-brand" aria-hidden="true" />
            Overview
          </span>
          <span className="text-muted">Sections</span>
        </button>
      </div>
      <nav aria-label="Website sections" className="hidden w-60 shrink-0 p-3 md:block">
        <ul className="flex flex-col gap-0.5">
          {NAV.map((item) => (
            <li key={item.id}>
              <NavButton item={item} onOverview={onOverview} onCheck={onCheck} onScope={onScope} />
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

function NavButton({
  item,
  onOverview,
  onCheck,
  onScope,
  tall,
}: {
  item: NavItem;
  onOverview: () => void;
  onCheck: (id: CheckId) => void;
  onScope: (title: string) => void;
  tall?: boolean;
}) {
  const Icon = item.icon;
  const current = item.id === "overview";
  return (
    <button
      type="button"
      aria-current={current ? "page" : undefined}
      onClick={() => {
        if (item.check) onCheck(item.check);
        else if (item.scope) onScope(item.label);
        else onOverview();
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 text-left text-sm",
        tall ? "min-h-11" : "min-h-9",
        current ? "bg-raised font-medium text-fg" : "text-muted hover:bg-raised hover:text-fg",
      )}
    >
      <Icon className={cn("size-4 shrink-0", current && "text-brand")} aria-hidden="true" />
      {item.label}
    </button>
  );
}

function MobileNav({
  open,
  onOpenChange,
  onOverview,
  onCheck,
  onScope,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOverview: () => void;
  onCheck: (id: CheckId) => void;
  onScope: (title: string) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-fade fixed inset-0 z-50 bg-overlay" />
        <Dialog.Content className="dialog-pop fixed inset-y-0 left-0 z-50 flex w-72 max-w-full flex-col bg-surface p-4 text-fg shadow-pop">
          <Dialog.Title className="text-base font-semibold">Website sections</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted">
            Other pages are outside this prototype. Checks scroll within the overview.
          </Dialog.Description>
          <nav aria-label="Website sections" className="mt-3 overflow-y-auto">
            <ul className="flex flex-col gap-0.5">
              {NAV.map((item) => (
                <li key={item.id}>
                  <NavButton item={item} tall onOverview={onOverview} onCheck={onCheck} onScope={onScope} />
                </li>
              ))}
            </ul>
          </nav>
          <Dialog.Close className="absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-fg">
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Board({
  phase,
  sample,
  tab,
  tally,
  onTab,
  onOpen,
  onScope,
}: {
  phase: Phase;
  sample: boolean;
  tab: "active" | "disabled";
  tally: ReturnType<typeof counts>;
  onTab: (tab: "active" | "disabled") => void;
  onOpen: (id: CheckId) => void;
  onScope: (title: string) => void;
}) {
  const attention = CHECKS.filter((id) => presence(id, phase) === "attention");
  const running = CHECKS.filter((id) => {
    const state = presence(id, phase);
    return state === "checking" || state === "pending";
  });
  const healthy = CHECKS.filter((id) => presence(id, phase) === "healthy");

  function onTabKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = tab === "active" ? "disabled" : "active";
    onTab(next);
    requestAnimationFrame(() => document.getElementById(`tab-${next}`)?.focus());
  }

  return (
    <div>
      <Summary phase={phase} />
      <div role="tablist" aria-label="Checks" className="flex gap-4 border-b border-line px-4" onKeyDown={onTabKey}>
        <TabButton id="active" selected={tab === "active"} count={tally.active} tone="brand" onSelect={() => onTab("active")}>
          Active
        </TabButton>
        <TabButton
          id="disabled"
          selected={tab === "disabled"}
          count={tally.disabled}
          tone="muted"
          onSelect={() => onTab("disabled")}
        >
          Disabled
        </TabButton>
      </div>
      {tab === "active" ? (
        <div role="tabpanel" id="panel-active" aria-labelledby="tab-active">
          <CheckSection title="Needs attention" count={attention.length}>
            {attention.map((id) => (
              <CheckCard key={id} id={id} phase={phase} sample={sample} onOpen={onOpen} onScope={onScope} />
            ))}
          </CheckSection>
          {running.length > 0 ? (
            <CheckSection title="Still running" count={running.length} spaced>
              {running.map((id) => (
                <CheckCard key={id} id={id} phase={phase} sample={sample} onOpen={onOpen} onScope={onScope} />
              ))}
            </CheckSection>
          ) : null}
          <CheckSection
            title={phase === "running" ? "Finished · healthy" : "Healthy checks"}
            count={healthy.length}
            spaced
          >
            {healthy.map((id) => (
              <CheckCard key={id} id={id} phase={phase} sample={sample} onOpen={onOpen} onScope={onScope} />
            ))}
          </CheckSection>
        </div>
      ) : (
        <div role="tabpanel" id="panel-disabled" aria-labelledby="tab-disabled" className="px-4 py-4">
          <h2 className="text-base font-semibold">3 disabled checks</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            These checks are turned off for deuxphoto.com. Their names are not included in this prototype.
          </p>
        </div>
      )}
    </div>
  );
}

function Summary({ phase }: { phase: Phase }) {
  const running = phase === "running";
  return (
    <section id="monitoring-summary" aria-live="polite" className="scroll-mt-28 border-b border-line px-4 py-2.5">
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
        <span className="font-semibold text-fg">
          {running ? "Running initial checks" : "2 checks need attention"}
        </span>
        <span className="text-faint" aria-hidden="true">
          ·
        </span>
        <span className="text-muted">
          {running ? "Results will appear as each check finishes." : "Initial checks complete"}
        </span>
      </p>
    </section>
  );
}

function TabButton({
  id,
  selected,
  count,
  tone,
  onSelect,
  children,
}: {
  id: string;
  selected: boolean;
  count: number;
  tone: "brand" | "muted";
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-selected={selected}
      aria-controls={`panel-${id}`}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 border-b-2 px-1 text-sm font-medium",
        selected ? "border-brand text-fg" : "border-transparent text-muted hover:text-fg",
      )}
    >
      {children}
      <span
        className={cn(
          "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums",
          tone === "brand" && selected ? "bg-brand text-on-brand" : "bg-raised text-muted",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function CheckSection({
  title,
  count,
  spaced,
  children,
}: {
  title: string;
  count: number;
  spaced?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn(spaced && "mt-10")}>
      <h2 className="px-4 pt-4 pb-2 text-xs font-semibold tracking-wide text-faint uppercase">
        {title}
        <span className="ml-2 font-normal tabular-nums">{count}</span>
      </h2>
      <div className="relative grid lg:grid-cols-2 lg:items-start">
        <div
          className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-line lg:block"
          aria-hidden="true"
        />
        {children}
      </div>
    </section>
  );
}

function CheckCard({
  id,
  phase,
  sample,
  onOpen,
  onScope,
}: {
  id: CheckId;
  phase: Phase;
  sample: boolean;
  onOpen: (id: CheckId) => void;
  onScope: (title: string) => void;
}) {
  const state = presence(id, phase);
  const ready = state === "healthy" || state === "attention";
  return (
    <article
      id={`check-${id}`}
      tabIndex={-1}
      aria-busy={state === "checking"}
      className="min-w-0 scroll-mt-28 border-t border-line px-4 py-4 outline-none"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-2">
          <StatusMark state={state} />
          <button
            type="button"
            onClick={() => onOpen(id)}
            className="-my-1 rounded-sm py-2 text-left text-base font-semibold text-fg hover:text-brand"
          >
            {CHECK_LABEL[id]}
          </button>
        </h3>
        <CardMenu label={CHECK_LABEL[id]} onDetails={() => onOpen(id)} onScope={() => onScope(CHECK_LABEL[id])} />
      </div>
      <p className="mt-2 text-sm text-muted">{cardBody(id, state)}</p>
      {ready ? <CardFacts id={id} phase={phase} onOpen={() => onOpen(id)} /> : null}
      {id === "uptime" && ready ? <UptimeTimeline sample={sample} /> : null}
      {id === "lighthouse" && state === "attention" ? (
        <PerformanceTrend sample={sample} />
      ) : null}
    </article>
  );
}

function StatusMark({ state }: { state: Presence }) {
  if (state === "checking") {
    return <Loader2 className="size-3.5 shrink-0 animate-spin text-muted" aria-hidden="true" />;
  }
  if (state === "pending") {
    return <CircleDashed className="size-3.5 shrink-0 text-faint" aria-hidden="true" />;
  }
  return (
    <span
      className={cn("size-2.5 shrink-0 rounded-full", state === "attention" ? "bg-down" : "bg-ok")}
      aria-hidden="true"
    />
  );
}

function cardBody(id: CheckId, state: Presence): string {
  if (state === "checking") {
    return id === "lighthouse"
      ? "Scores are not available yet. They will appear when this check finishes."
      : "Still running. An issue count will not appear until this check finishes.";
  }
  if (state === "pending") return "Pending. This check has not started, so there is no result yet.";
  const when = `We last checked ${LAST_CHECKED[id]}.`;
  switch (id) {
    case "uptime":
      return `deuxphoto.com is up. ${when}`;
    case "certificate":
      return `Your certificate is healthy. ${when}`;
    case "broken-links":
      return `1 broken link found. ${when}`;
    case "mixed-content":
      return `We did not find mixed content. ${when}`;
    case "lighthouse":
      return `Lighthouse reported issues. ${when}`;
    case "dns":
      return `DNS records found. ${when}`;
    case "domain":
      return `Your domain seems to be ok. ${when}`;
    case "blocklist":
      return `Your domain is not listed on any monitored blocklists. ${when}`;
  }
}

function CardFacts({ id, phase, onOpen }: { id: CheckId; phase: Phase; onOpen?: () => void }) {
  if (id === "uptime" && phase === "complete") {
    return (
      <StatRow>
        <Figure label="Past 7 days" value="100%" hint="No downtime recorded in the past 7 days." onOpen={onOpen} />
        <Figure label="Past 14 days" value="100%" hint="No downtime recorded in the past 14 days." onOpen={onOpen} />
        <Figure label="Past 30 days" value="100%" hint="No downtime recorded in the past 30 days." align="end" onOpen={onOpen} />
      </StatRow>
    );
  }
  if (id === "uptime") return null;
  if (id === "certificate") {
    return (
      <StatRow>
        <Figure label="Expires in" value="2 months from now" hint="The certificate is valid and expires in 2 months." onOpen={onOpen} />
      </StatRow>
    );
  }
  if (id === "broken-links") {
    return (
      <StatRow>
        <Figure label="Broken links" value="1" hint="1 page returned a broken link. The URL is not in this prototype." onOpen={onOpen} />
        <Figure label="URLs crawled" value="273" hint="273 URLs were crawled in this check." align="end" onOpen={onOpen} />
      </StatRow>
    );
  }
  if (id === "mixed-content") {
    return (
      <StatRow>
        <Figure label="Pieces of mixed content" value="0" hint="No mixed content found on the crawled pages." onOpen={onOpen} />
        <Figure label="URLs crawled" value="272" hint="272 URLs were crawled in this check." align="end" onOpen={onOpen} />
      </StatRow>
    );
  }
  if (id === "lighthouse") {
    const scores = [
      ["Performance", "42", "Poor result, and the lowest score in this run. The failing audits are not in this prototype."],
      ["Accessibility", "89", "Some checks did not pass. Those audits are not in this prototype."],
      ["Best practices", "100", "Clean result. Nothing failed in this category."],
      ["SEO", "92", "Mostly solid. A few checks did not pass. Those audits are not in this prototype."],
    ] as const;
    return (
      <div className="metric-shell mt-3 grid grid-cols-2 lg:grid-cols-4">
        {scores.map(([label, value, hint], index) => (
          <Figure
            key={label}
            label={label}
            value={value}
            hint={hint}
            tone={scoreTone(Number(value))}
            align={index % 2 === 1 ? "end" : "start"}
            onOpen={onOpen}
            className={cn(
              index % 2 === 1 && "border-l border-hairline",
              index >= 2 && "border-t border-hairline lg:border-t-0",
              index > 0 && "lg:border-l lg:border-hairline",
            )}
          />
        ))}
      </div>
    );
  }
  if (id === "dns") {
    return (
      <StatRow>
        <Figure label="DNS records" value="6" hint="6 DNS records found for this domain." onOpen={onOpen} />
        <Figure label="Nameservers" value="2" hint="2 nameservers serve this domain." align="end" onOpen={onOpen} />
      </StatRow>
    );
  }
  if (id === "domain") {
    return (
      <StatRow>
        <Figure label="Expires in" value="5 months from now" hint="The domain registration is valid for 5 more months." onOpen={onOpen} />
      </StatRow>
    );
  }
  return (
    <StatRow>
      <Figure label="Blocklists checked" value="11" hint="Not listed on these 11 blocklists." onOpen={onOpen} />
    </StatRow>
  );
}

function StatRow({ children }: { children: ReactNode }) {
  return <div className="metric-shell mt-3 flex divide-x divide-hairline">{children}</div>;
}

function Figure({
  label,
  value,
  hint,
  tone,
  align = "start",
  onOpen,
  className,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: string;
  align?: "start" | "end";
  onOpen?: () => void;
  className?: string;
}) {
  const tipId = useId();
  const body = (
    <>
      <span className="text-xs font-medium tracking-normal whitespace-nowrap text-faint uppercase">{label}</span>
      <span className={cn("mt-1 text-base font-semibold tabular-nums", tone ?? "text-fg")}>{value}</span>
    </>
  );
  if (!onOpen) {
    return <div className={cn("min-w-0 flex-1 px-3 py-2.5", className)}>{body}</div>;
  }
  return (
    <div className={cn("group relative min-w-0 flex-1", className)}>
      <button
        type="button"
        onClick={onOpen}
        aria-describedby={tipId}
        className="flex h-full w-full flex-col px-3 py-2.5 text-left"
      >
        {body}
      </button>
      <div
        role="tooltip"
        id={tipId}
        className={cn(
          "pointer-events-none absolute bottom-full z-30 mb-1 w-56 rounded-lg border border-line bg-raised px-3 py-2 text-xs opacity-0 shadow-pop group-hover:opacity-100 group-focus-within:opacity-100",
          align === "end" ? "right-0" : "left-0",
        )}
      >
        <p className="text-pretty text-muted">{hint}</p>
      </div>
    </div>
  );
}

function scoreTone(value: number) {
  if (value < 50) return "text-down-text";
  if (value < 90) return "text-amber";
  return "text-ok";
}

function CardMenu({
  label,
  onDetails,
  onScope,
}: {
  label: string;
  onDetails: () => void;
  onScope: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`${label} actions`}
          className="-my-2.5 inline-flex size-11 items-center justify-center rounded-md text-faint hover:text-fg"
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-44 rounded-lg border border-line bg-surface p-1 text-fg shadow-pop"
        >
          <MenuItem onSelect={onDetails}>View details</MenuItem>
          <MenuItem onSelect={onScope}>Full check page</MenuItem>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MenuItem({ children, onSelect }: { children: ReactNode; onSelect: () => void }) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className="flex min-h-11 cursor-pointer items-center rounded-md px-3 text-sm outline-none data-[highlighted]:bg-raised"
    >
      {children}
    </DropdownMenu.Item>
  );
}

function InfoDialog({
  dialog,
  phase,
  sample,
  onOpenChange,
}: {
  dialog: ActiveDialog;
  phase: Phase;
  sample: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={dialog !== null} onOpenChange={onOpenChange}>
      {dialog ? (
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-fade fixed inset-0 z-50 bg-overlay" />
          <Dialog.Content className="dialog-pop fixed inset-x-4 top-1/2 z-50 mx-auto max-h-screen max-w-lg -translate-y-1/2 overflow-y-auto rounded-xl border border-line bg-surface p-5 text-fg shadow-pop">
            {dialog.kind === "scope" ? (
              <>
                <Dialog.Title className="pr-10 text-lg font-semibold">{dialog.title}</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-muted">{SCOPE_BODY}</Dialog.Description>
              </>
            ) : (
              <DetailBody id={dialog.id} phase={phase} sample={sample} />
            )}
            <Dialog.Close className="absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-fg">
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      ) : null}
    </Dialog.Root>
  );
}

function DetailBody({ id, phase, sample }: { id: CheckId; phase: Phase; sample: boolean }) {
  const state = presence(id, phase);
  return (
    <>
      <Dialog.Title className="pr-10 text-lg font-semibold">{CHECK_LABEL[id]}</Dialog.Title>
      <Dialog.Description className="mt-2 text-sm text-muted">{cardBody(id, state)}</Dialog.Description>
      {state === "healthy" || state === "attention" ? <CardFacts id={id} phase={phase} /> : null}
      {id === "uptime" && (state === "healthy" || state === "attention") ? <UptimeTimeline sample={sample} /> : null}
      {id === "lighthouse" && state === "attention" ? <PerformanceTrend sample={sample} /> : null}
      <ScopeNote id={id} state={state} />
    </>
  );
}

function ScopeNote({ id, state }: { id: CheckId; state: Presence }) {
  let text = "The full check page, history, and settings are not included in this prototype.";
  if (state === "checking" || state === "pending") {
    text = "No result is available yet. This prototype does not invent a status, a score, or a zero.";
  } else if (id === "broken-links") {
    text =
      "The affected URL, where it was linked from, and any suggested fix are not included in this prototype.";
  } else if (id === "lighthouse") {
    text =
      "Which audits failed, the configured thresholds, and any recommendations are not included in this prototype.";
  }
  return <p className="mt-4 text-sm text-muted">{text}</p>;
}
