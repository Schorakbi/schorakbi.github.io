// Architecture map: three lanes (ship, run, watch) with animated links. Picking a part shows what I built there.
// Simplified and generic on purpose. Every fact comes from the CV (build/content.js).

const LANES = [
  { id: "ship", k: { en: "Ship", fr: "Livrer" } },
  { id: "run", k: { en: "Run · AWS, 3 accounts", fr: "Exécuter · AWS, 3 comptes" }, box: true },
  { id: "watch", k: { en: "Watch", fr: "Surveiller" } },
];

const NODES = [
  { id: "pr", lane: "ship", col: 1, h: { en: "Pull request", fr: "Pull request" }, s: { en: "seqctl, a Go CLI", fr: "seqctl, un CLI en Go" },
    d: { en: "seqctl replaced ad-hoc scripts. Pipelines call it for CI/CD change detection (which environments a PR touches), environment scaffolding, secrets validation, database provisioning and incident tooling.",
         fr: "seqctl remplace les scripts ad hoc. Les pipelines l'appellent pour détecter les changements (quels environnements une PR touche), créer des environnements, valider les secrets, provisionner les bases et outiller les incidents." },
    tags: ["Go", "CLI"] },
  { id: "gha", lane: "ship", col: 2, h: { en: "GitHub Actions", fr: "GitHub Actions" }, s: { en: "keyless, OIDC", fr: "sans clés, OIDC" },
    d: { en: "No stored AWS keys in CI: OIDC roles with least-privilege IAM. tflint, tfsec and Checkov on every PR, approval-gated production applies. 249 automated applies at 93% success, 3-min median.",
         fr: "Aucune clé AWS stockée dans la CI : des rôles OIDC à moindre privilège. tflint, tfsec et Checkov sur chaque PR, applies de production avec approbation. 249 applies automatisés, 93 % de succès, 3 min en médiane." },
    stat: { en: "91h → 29h lead time, 18% → 3% failed deploys, with the team", fr: "délai 91 h → 29 h, échecs 18 % → 3 %, en équipe" },
    tags: ["OIDC", "tfsec", "Checkov", "DORA"] },
  { id: "tf", lane: "ship", col: 3, h: { en: "Terraform", fr: "Terraform" }, s: { en: "7 roots · 3 accounts", fr: "7 roots · 3 comptes" },
    d: { en: "Production was built by hand in the AWS console. I imported it into Terraform without rebuilding anything, and drift detection runs every day.",
         fr: "La production avait été créée à la main dans la console AWS. Je l'ai importée dans Terraform sans rien reconstruire, et la détection de drift tourne chaque jour." },
    stat: { en: "1,625 production resources under code", fr: "1 625 ressources de production en code" },
    tags: ["Terraform", "import", "drift detection"] },
  { id: "sec", lane: "run", col: 1, h: { en: "IAM & security", fr: "IAM & sécurité" }, s: { en: "ISO 27001", fr: "ISO 27001" },
    d: { en: "Least-privilege IAM and KMS, secrets kept out of Terraform state, GuardDuty and WAF monitoring, branch protection as code. Access is time-boxed and approved in Slack, with a CloudTrail audit trail.",
         fr: "IAM à moindre privilège et KMS, secrets hors de l'état Terraform, supervision GuardDuty et WAF, protection des branches en code. Les accès sont temporaires, approuvés dans Slack et tracés par CloudTrail." },
    tags: ["IAM", "KMS", "GuardDuty", "WAF", "CloudTrail"] },
  { id: "ecs", lane: "run", col: 2, h: { en: "Services", fr: "Services" }, s: { en: "ECS · Lambda", fr: "ECS · Lambda" },
    d: { en: "The product runs on Amazon ECS and AWS Lambda. All of it was migrated into Terraform and deploys through the pipeline, with alarms on crash loops, OOM and 5xx.",
         fr: "Le produit tourne sur Amazon ECS et AWS Lambda. Tout a été migré dans Terraform et se déploie par le pipeline, avec des alarmes sur les crash loops, les OOM et les 5xx." },
    tags: ["ECS", "Lambda"] },
  { id: "james", lane: "run", col: 3, h: { en: "James", fr: "James" }, s: { en: "multi-tenant AI agents", fr: "agents IA multi-tenant" },
    d: { en: "Each tenant's agent runs in its own sandbox on shared hosts: ECS on EC2 with cgroup v2 delegation, user namespaces, per-tenant FUSE file systems, seccomp and Landlock, behind Auth0.",
         fr: "L'agent de chaque client tourne dans son propre bac à sable sur des hôtes partagés : ECS sur EC2 avec délégation cgroup v2, user namespaces, FUSE par client, seccomp et Landlock, derrière Auth0." },
    stat: { en: "Live in production since 10/2026", fr: "En production depuis 10/2026" },
    tags: ["cgroup v2", "namespaces", "seccomp", "Landlock"] },
  { id: "data", lane: "run", col: 4, h: { en: "Data", fr: "Données" }, s: { en: "RDS PostgreSQL · SQS", fr: "RDS PostgreSQL · SQS" },
    d: { en: "RDS PostgreSQL with slow-query insight through pg_stat_statements, and SQS queues watched by dead-letter alarms.",
         fr: "RDS PostgreSQL avec analyse des requêtes lentes via pg_stat_statements, et des files SQS surveillées par des alarmes de dead-letter." },
    tags: ["RDS", "PostgreSQL", "SQS"] },
  { id: "obs", lane: "watch", col: 1, h: { en: "Observability", fr: "Observabilité" }, s: { en: "21 alarms", fr: "21 alarmes" },
    d: { en: "Amazon Managed Prometheus, Grafana, OpenTelemetry and CloudWatch. 21 production alarms: crash loops, OOM, DLQ, 5xx, RDS. Plus the DORA dashboard that tracks delivery.",
         fr: "Amazon Managed Prometheus, Grafana, OpenTelemetry et CloudWatch. 21 alarmes de production : crash loops, OOM, DLQ, 5xx, RDS. Et le tableau de bord DORA qui suit la livraison." },
    tags: ["Prometheus", "Grafana", "OpenTelemetry", "CloudWatch"] },
  { id: "ai", lane: "watch", col: 2, h: { en: "AI investigator", fr: "Investigateur IA" }, s: { en: "Go · Lambda · Claude API", fr: "Go · Lambda · API Claude" },
    d: { en: "When an alarm fires, it inspects ECS, logs, Prometheus metrics and PostgreSQL with read-only IAM, then posts a root-cause verdict with customer impact.",
         fr: "Quand une alarme se déclenche, il analyse ECS, les logs, les métriques Prometheus et PostgreSQL avec un IAM en lecture seule, puis publie un diagnostic de cause racine avec l'impact client." },
    tags: ["Go", "Lambda", "Claude API"] },
  { id: "slack", lane: "watch", col: 3, h: { en: "Slack", fr: "Slack" }, s: { en: "one thread per alarm", fr: "un fil par alarme" },
    d: { en: "Every alarm lands as its own thread with the investigator's verdict. Time-boxed IAM access requests are approved here too.",
         fr: "Chaque alarme arrive dans son propre fil avec le diagnostic de l'investigateur. Les demandes d'accès IAM temporaires sont aussi approuvées ici." },
    tags: ["incident response"] },
  { id: "nomad", lane: "watch", col: 4, wip: true, h: { en: "Nomad", fr: "Nomad" }, s: { en: "next · step 1 of 15", fr: "prochain · étape 1 sur 15" },
    d: { en: "In progress: a 15-step plan to run the platform on a self-hosted HashiCorp Nomad stack outside AWS. Step 1 delivered: a hardened single-VM cluster with ACLs and private-only listeners.",
         fr: "En cours : un plan en 15 étapes pour faire tourner la plateforme sur une pile HashiCorp Nomad auto-hébergée, hors AWS. Étape 1 livrée : un cluster mono-VM durci, avec ACL et écoute privée uniquement." },
    tags: ["HashiCorp Nomad", "ACLs"] },
];

// from, to, dashed. "lane:run" targets the AWS box itself.
const ARCH_LINKS = [
  ["pr", "gha"], ["gha", "tf"], ["tf", "lane:run"],
  ["sec", "ecs", true], ["ecs", "james"], ["james", "data"],
  ["lane:run", "obs"], ["obs", "ai"], ["ai", "slack"],
  ["ai", "ecs", true], ["slack", "sec", true], ["lane:run", "nomad", true],
];

const arch = document.getElementById("arch");
const archLines = document.getElementById("archLines");
const archDetail = document.getElementById("archDetail");
let archSel = "tf";

function renderArch() {
  arch.querySelectorAll(".lane").forEach((n) => n.remove());
  for (const L of LANES) {
    const lane = el("div", "lane" + (L.box ? " box" : ""));
    lane.dataset.lane = L.id;
    lane.append(el("p", "lane-k mono", nb(L.k[lang])));
    const row = el("div", "lane-row");
    for (const n of NODES.filter((x) => x.lane === L.id)) {
      const b = el("button", "node" + (n.wip ? " wip" : ""), `<b>${nb(n.h[lang])}</b><span>${nb(n.s[lang])}</span>`);
      b.type = "button";
      b.dataset.id = n.id;
      b.style.gridColumn = n.col;
      b.setAttribute("aria-pressed", String(n.id === archSel));
      b.onclick = () => {
        selectNode(n.id);
        // on narrow screens the detail sits under the map, bring it into view
        if (innerWidth <= 1100) archDetail.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
      };
      row.append(b);
    }
    lane.append(row);
    arch.append(lane);
  }
  selectNode(archSel);
  requestAnimationFrame(drawLinks);
}

function selectNode(id) {
  archSel = id;
  const n = NODES.find((x) => x.id === id);
  arch.querySelectorAll(".node").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
  archDetail.innerHTML = `<p class="kicker mono">${nb(n.s[lang])}</p><h3>${nb(n.h[lang])}</h3>
    <p>${nb(n.d[lang])}</p>${n.stat ? `<p class="stat">${nb(n.stat[lang])}</p>` : ""}
    <ul class="tags">${n.tags.map((t) => `<li>${t}</li>`).join("")}</ul>`;
  archLines.querySelectorAll("path").forEach((p) => p.classList.toggle("hot", p.dataset.a === id || p.dataset.b === id));
}

// Links are drawn from live element positions, so they follow any layout and screen size.
function drawLinks() {
  const box = arch.getBoundingClientRect();
  archLines.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
  const rect = (id) => {
    const n = id.startsWith("lane:") ? arch.querySelector(`.lane[data-lane="${id.slice(5)}"]`) : arch.querySelector(`.node[data-id="${id}"]`);
    const r = n.getBoundingClientRect();
    return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height, lane: id.startsWith("lane:") };
  };
  const paths = ARCH_LINKS.map(([a, b, dashed]) => {
    const A = rect(a), B = rect(b);
    let d;
    if (!A.lane && !B.lane && Math.abs(A.y - B.y) < 8) {
      // same row: side to side
      const [L, R] = A.x < B.x ? [A, B] : [B, A];
      const x1 = L.x + L.w, x2 = R.x, y = L.y + L.h / 2;
      d = `M${x1},${y} L${x2},${y}`;
    } else {
      // between rows: from the bottom of the upper one to the top of the lower one
      const [U, D] = A.y < B.y ? [A, B] : [B, A];
      const ux = U.lane ? (D.lane ? D.x + D.w / 2 : D.x + D.w / 2) : U.x + U.w / 2;
      const dx = D.lane ? ux : D.x + D.w / 2;
      const y1 = U.y + U.h, y2 = D.y, m = (y1 + y2) / 2;
      d = `M${ux},${y1} C${ux},${m} ${dx},${m} ${dx},${y2}`;
    }
    const dir = A.y < B.y || (Math.abs(A.y - B.y) < 8 && A.x < B.x) ? "" : " rev";
    return `<path d="${d}" data-a="${a}" data-b="${b}" class="${dashed ? "soft" : "flow"}${dir}"/>`;
  });
  archLines.innerHTML = paths.join("");
  selectNode(archSel);
}

new ResizeObserver(() => drawLinks()).observe(arch);
langListeners.push(renderArch);
renderArch();
