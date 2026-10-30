// Landing page. Every fact comes from the CV (build/content.js). Keep them in sync.

const UI = {
  title: { en: "Mehdi Ziadi · DevOps & Cloud Infrastructure Engineer", fr: "Mehdi Ziadi · Ingénieur DevOps & Infrastructure Cloud" },
  en: {
    skipLink: "Skip to the work", navWork: "Work", navExp: "Experience", navArch: "Architecture", navStack: "Stack", navAsk: "Ask", navContact: "Contact",
    status: "Open to relocation · based in Tunis",
    role: "DevOps & Cloud Infrastructure Engineer",
    lede: "Sole infrastructure engineer at an AI SaaS. I took a production built by hand and turned it into code, automated pipelines and production alarms.",
    ctaMail: "Email me", ctaCv: "Download CV", cvOnline: "CV online",
    workK: "Selected work · Sequesto, 09/2025 to now", workH: "What I built",
    workSub: "Sequesto is an AI document-analysis SaaS where I own the AWS infrastructure end to end. Author of 89% of 660 commits and 366 merged PRs.",
    before: "Before", did: "What I did", result: "Result",
    archK: "Architecture · simplified", archH: "How it fits <em>together</em>",
    archSub: "The platform I run, from a pull request to a production alarm. Pick any part to see what I built there.",
    archNote: "Simplified and generic. Built from my public CV, no internal details.",
    expK: "Trajectory", expH: "Experience & education",
    stackK: "Toolbox", stackH: "Stack",
    askH: "Ask me <em>anything</em>",
    askSub: "CAPCOM answers from my CV, in English or French. No AI service behind it, nothing you type leaves your browser.",
    askLabel: "Your question", askPh: "e.g. tell me about James", send: "Send",
    contactK: "Contact", contactH: "Hiring for infrastructure? <em>Let's talk.</em>",
    contactSub: "Based in Tunis and ready to relocate. I work in English and French.",
    copy: "Copy", copied: "Copied", egg: "Bored of CVs? Fly the ship", metLabel: "In production for",
  },
  fr: {
    skipLink: "Aller aux réalisations", navWork: "Réalisations", navExp: "Parcours", navArch: "Architecture", navStack: "Stack", navAsk: "Questions", navContact: "Contact",
    status: "Mobilité internationale · basé à Tunis",
    role: "Ingénieur DevOps & Infrastructure Cloud",
    lede: "Seul ingénieur infrastructure d'un SaaS d'IA. J'ai repris une production montée à la main et l'ai transformée en code, en pipelines automatisés et en alarmes de production.",
    ctaMail: "M'écrire", ctaCv: "Télécharger le CV", cvOnline: "CV en ligne",
    workK: "Réalisations · Sequesto, depuis 09/2025", workH: "Ce que j'ai construit",
    workSub: "Sequesto est un SaaS d'analyse documentaire par IA dont je gère l'infrastructure AWS de bout en bout. Auteur de 89 % des 660 commits et de 366 PR mergées.",
    before: "Avant", did: "Ce que j'ai fait", result: "Résultat",
    archK: "Architecture · simplifiée", archH: "Comment tout <em>s'assemble</em>",
    archSub: "La plateforme que je fais tourner, de la pull request à l'alarme de production. Choisissez un élément pour voir ce que j'y ai construit.",
    archNote: "Vue simplifiée et générique, construite à partir de mon CV public, sans détail interne.",
    expK: "Trajectoire", expH: "Expérience & formation",
    stackK: "Boîte à outils", stackH: "Stack",
    askH: "Posez-moi <em>vos questions</em>",
    askSub: "CAPCOM répond à partir de mon CV, en français ou en anglais. Aucun service d'IA derrière, rien de ce que vous tapez ne quitte votre navigateur.",
    askLabel: "Votre question", askPh: "ex. parle-moi de James", send: "Envoyer",
    contactK: "Contact", contactH: "Vous recrutez en infrastructure ? <em>Parlons-en.</em>",
    contactSub: "Basé à Tunis et prêt à m'installer à l'étranger. Je travaille en français et en anglais.",
    copy: "Copier", copied: "Copié", egg: "Marre des CV ? Pilotez le vaisseau", metLabel: "En production depuis",
  },
};

const STATS = [
  { n: { en: "1,625", fr: "1 625" }, l: { en: "production AWS resources moved into Terraform", fr: "ressources AWS de production passées dans Terraform" } },
  { n: { en: "91h → 29h", fr: "91 h → 29 h" }, l: { en: "merge-to-production lead time, with the team", fr: "délai merge-production, en équipe" } },
  { n: { en: "18% → 3%", fr: "18 % → 3 %" }, l: { en: "failed deployments, with the team", fr: "déploiements en échec, en équipe" } },
  { n: { en: "249", fr: "249" }, l: { en: "automated Terraform applies, 93% success, 3-min median", fr: "applies Terraform automatisés, 93 % de succès, 3 min en médiane" } },
];

// Three featured projects with before / what / result, then four shorter ones.
const BIG = [
  { icon: "iac", h: { en: "Production as code", fr: "La production en code" },
    before: { en: "Production built by hand in the AWS console, outside any code.", fr: "Une production créée à la main dans la console AWS, hors de tout code." },
    did: { en: "Imported 1,625 live resources (ECS, RDS, Lambda, IAM, KMS, SQS) into Terraform across 7 roots and 3 AWS accounts, without rebuilding anything.", fr: "Import de 1 625 ressources en production (ECS, RDS, Lambda, IAM, KMS, SQS) dans Terraform, sur 7 roots et 3 comptes AWS, sans rien reconstruire." },
    result: { en: "tflint, tfsec and Checkov on every PR, drift detection every day.", fr: "tflint, tfsec et Checkov sur chaque PR, détection de drift chaque jour." },
    tags: ["Terraform", "AWS", "tflint", "tfsec", "Checkov"] },
  { icon: "ci", h: { en: "Keyless GitOps CI/CD", fr: "CI/CD GitOps sans clés" },
    before: { en: "Terraform applied by hand from laptops.", fr: "Des applies Terraform lancés à la main depuis des portables." },
    did: { en: "GitHub Actions with OIDC roles and least-privilege IAM, scanning on every PR, approval-gated production applies, and a DORA dashboard in Grafana.", fr: "GitHub Actions avec rôles OIDC et IAM à moindre privilège, analyse sur chaque PR, applies de production avec approbation, et un tableau de bord DORA dans Grafana." },
    result: { en: "249 automated applies at 93% success. With the team: lead time 91h → 29h, failed deploys 18% → 3%.", fr: "249 applies automatisés, 93 % de succès. En équipe : délai 91 h → 29 h, déploiements en échec 18 % → 3 %." },
    tags: ["GitHub Actions", "OIDC", "IAM", "Grafana", "DORA"] },
  { icon: "james", h: { en: "James, a multi-tenant AI agent platform", fr: "James, plateforme d'agents IA multi-tenant" },
    before: { en: "Each tenant's agent runs in its own sandbox, so the hard part is isolation on shared hosts.", fr: "L'agent de chaque client tourne dans son propre bac à sable : le vrai défi, c'est l'isolation sur des hôtes partagés." },
    did: { en: "Provisioned ECS on EC2 with cgroup v2 delegation, user namespaces, per-tenant FUSE file systems, seccomp and Landlock hardening, and Auth0-protected ingress.", fr: "Provisionnement d'ECS sur EC2 avec délégation cgroup v2, user namespaces, systèmes de fichiers FUSE par client, durcissement seccomp et Landlock, et entrée protégée par Auth0." },
    result: { en: "Live in production since 10/2026.", fr: "En production depuis 10/2026." },
    tags: ["Go", "ECS on EC2", "cgroup v2", "seccomp", "Landlock"] },
];

const SMALL = [
  { icon: "obs", h: { en: "Observability", fr: "Observabilité" },
    p: { en: "Amazon Managed Prometheus, Grafana, OpenTelemetry and CloudWatch. 21 production alarms (crash loops, OOM, DLQ, 5xx, RDS) and PostgreSQL slow-query insight.", fr: "Amazon Managed Prometheus, Grafana, OpenTelemetry et CloudWatch. 21 alarmes de production (crash loops, OOM, DLQ, 5xx, RDS) et analyse des requêtes lentes PostgreSQL." } },
  { icon: "ai", h: { en: "AI incident investigator", fr: "Investigateur d'incidents IA" },
    p: { en: "Go on AWS Lambda with read-only IAM. Opens a Slack thread per alarm, inspects ECS, logs, metrics and PostgreSQL, and posts a root-cause verdict with customer impact.", fr: "Go sur AWS Lambda, IAM en lecture seule. Ouvre un fil Slack par alarme, analyse ECS, logs, métriques et PostgreSQL, et publie un diagnostic de cause racine avec l'impact client." } },
  { icon: "sec", h: { en: "Security for ISO 27001", fr: "Sécurité ISO 27001" },
    p: { en: "Time-boxed IAM access through a Slack approval bot with CloudTrail audit, secrets kept out of Terraform state, GuardDuty and WAF monitoring, branch protection as code.", fr: "Accès IAM temporaires via un bot Slack d'approbation audité par CloudTrail, secrets hors de l'état Terraform, supervision GuardDuty et WAF, protection des branches en code." } },
  { icon: "cli", h: { en: "seqctl, a Go CLI", fr: "seqctl, un CLI en Go" },
    p: { en: "Replaced ad-hoc scripts: CI/CD change detection, environment scaffolding, secrets validation, database provisioning and incident tooling.", fr: "Remplace les scripts ad hoc : détection des changements en CI/CD, création d'environnements, validation des secrets, bases de données et outils d'incident." } },
];

const NOW = {
  k: { en: "In progress", fr: "En cours" },
  h: { en: "Self-hosted platform on HashiCorp Nomad", fr: "Plateforme auto-hébergée sur HashiCorp Nomad" },
  p: { en: "Leading a 15-step plan to run the platform outside AWS. Step 1 delivered: a hardened single-VM Nomad cluster with ACLs and private-only listeners.", fr: "Je pilote un plan en 15 étapes pour faire tourner la plateforme hors AWS. Étape 1 livrée : un cluster Nomad mono-VM durci, avec ACL et écoute sur réseau privé uniquement." },
  step: { en: "Step 1 of 15", fr: "Étape 1 sur 15" },
};

// Small line icons, drawn with currentColor.
const ICONS = {
  iac: '<path d="M4 7l8-4 8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4"/><path d="M4 17l8 4 8-4"/>',
  ci: '<circle cx="5" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="12" r="2"/><path d="M5 8v8M7 6c6 0 6 6 10 6M7 18c6 0 6-6 10-6"/>',
  james: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  obs: '<path d="M3 17l5-6 4 3 4-7 5 5"/><path d="M3 21h18"/>',
  ai: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M9 11h4M11 9v4"/>',
  sec: '<path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
  cli: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M12 15h5"/>',
};
const icon = (k) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;

const TIMELINE = [
  { when: { en: "09/2025 – now", fr: "09/2025 – aujourd'hui" }, now: true,
    h: { en: "DevOps & Infrastructure Engineer", fr: "Ingénieur DevOps & Infrastructure" },
    org: { en: "Sequesto, AI document-analysis SaaS · Remote", fr: "Sequesto, SaaS d'analyse documentaire par IA · Remote" },
    p: { en: "Sole infrastructure engineer. Everything above.", fr: "Seul ingénieur infrastructure. Tout ce qui précède." } },
  { when: { en: "02/2025 – 06/2025", fr: "02/2025 – 06/2025" },
    h: { en: "DevOps Engineer Intern", fr: "Stagiaire Ingénieur DevOps" },
    org: { en: "MASS Analytics · Tunis, Tunisia", fr: "MASS Analytics · Tunis, Tunisie" },
    p: { en: "AWS monitoring dashboards and alerting that cut MTTR by 30%, Terraform deployments that halved deployment time, JMeter load tests.", fr: "Supervision et alertes AWS réduisant le MTTR de 30 %, déploiements Terraform divisant leur durée par deux, tests de charge JMeter." } },
  { when: { en: "07/2024 – 08/2024", fr: "07/2024 – 08/2024" },
    h: { en: "AI Engineer Intern", fr: "Stagiaire Ingénieur IA" },
    org: { en: "SMZ · Ben Arous, Tunisia", fr: "SMZ · Ben Arous, Tunisie" },
    p: { en: "A multimodal AI tutor (web, video and image search with document Q&A), Next.js and FastAPI.", fr: "Un tuteur IA multimodal (recherche web, vidéo et image, questions-réponses sur documents), Next.js et FastAPI." } },
  { when: { en: "2022 – 2025", fr: "2022 – 2025" }, edu: true,
    h: { en: "Engineering Degree in ICT (Telecommunications)", fr: "Diplôme d'ingénieur en Télécommunications (TIC)" },
    org: { en: "National Engineering School of Tunis (ENIT)", fr: "École Nationale d'Ingénieurs de Tunis (ENIT)" } },
  { when: { en: "2020 – 2022", fr: "2020 – 2022" }, edu: true,
    h: { en: "Preparatory Cycle, Physics and Technology", fr: "Cycle préparatoire, Physique-Technologie" },
    org: { en: "Preparatory Institute for Engineering Studies of Nabeul (IPEIN)", fr: "Institut Préparatoire aux Études d'Ingénieurs de Nabeul (IPEIN)" } },
];

const tr = (o) => nb(o[lang]);

function render() {
  const u = UI[lang];
  document.getElementById("stats").innerHTML = STATS.map((s) =>
    `<li><b>${tr(s.n)}</b><span>${tr(s.l)}</span></li>`).join("");

  document.getElementById("cardsBig").innerHTML = BIG.map((c) => `<article class="card">
      <div class="card-top">${icon(c.icon)}<h3>${tr(c.h)}</h3></div>
      <dl>
        <dt>${u.before}</dt><dd>${tr(c.before)}</dd>
        <dt>${u.did}</dt><dd>${tr(c.did)}</dd>
        <dt class="res">${u.result}</dt><dd class="res">${tr(c.result)}</dd>
      </dl>
      <ul class="tags">${c.tags.map((t) => `<li>${t}</li>`).join("")}</ul>
    </article>`).join("");

  document.getElementById("cardsSmall").innerHTML = SMALL.map((c) => `<article class="card">
      <div class="card-top">${icon(c.icon)}<h3>${tr(c.h)}</h3></div>
      <p>${tr(c.p)}</p>
    </article>`).join("");

  document.getElementById("nowCard").innerHTML = `
    <p class="kicker mono"><span class="pulse" aria-hidden="true"></span>${tr(NOW.k)}</p>
    <div class="now-body"><h3>${tr(NOW.h)}</h3><p>${tr(NOW.p)}</p></div>
    <div class="now-prog" role="img" aria-label="${tr(NOW.step)}"><span class="mono">${tr(NOW.step)}</span>
      <div class="steps">${Array.from({ length: 15 }, (_, i) => `<i${i === 0 ? ' class="on"' : ""}></i>`).join("")}</div></div>`;

  document.getElementById("timeline").innerHTML = TIMELINE.map((j) => `<li class="${j.now ? "now" : ""}${j.edu ? " edu" : ""}">
      <span class="dot" aria-hidden="true"></span>
      <p class="when mono">${tr(j.when)}</p>
      <div><h3>${tr(j.h)}</h3><p class="org">${tr(j.org)}</p>${j.p ? `<p class="jp">${tr(j.p)}</p>` : ""}</div>
    </li>`).join("");

  const skills = CV_SKILLS[lang];
  document.getElementById("stackList").innerHTML = skills.map(([k, v]) =>
    `<div><dt class="mono">${k}</dt><dd>${splitSkills(v).map(chip).join("")}</dd></div>`).join("");
  document.getElementById("langs").innerHTML = nb(lang === "en"
    ? "Arabic (native) · French (fluent) · English (professional) · German (elementary)"
    : "Arabe (langue maternelle) · français (courant) · anglais (professionnel) · allemand (notions)");

  const other = lang === "en" ? "fr" : "en";
  document.getElementById("cvBtn").href = CV_PDF[lang];
  document.getElementById("contactBtns").innerHTML = `
    <a class="btn" href="${CV_PDF[lang]}" download>${lang === "en" ? "Download CV (PDF)" : "Télécharger le CV (PDF)"}</a>
    <a class="btn line" href="${CV_PDF[other]}" download>${lang === "en" ? "CV in French" : "CV en anglais"}</a>
    <a class="btn line" href="${LINKS.linkedin}" target="_blank" rel="noopener">LinkedIn ↗</a>
    <a class="btn line" href="${LINKS.github}" target="_blank" rel="noopener">GitHub ↗</a>`;
}

// Skills straight from the CV. Commas inside brackets stay with their group, e.g. "AWS (ECS, Lambda)".
const CV_SKILLS = {
  en: [
    ["Cloud", "AWS (ECS, Lambda, RDS PostgreSQL, S3, SQS, SNS, DynamoDB, CloudFront, WAF, ALB, Route 53, IAM, KMS, Secrets Manager, GuardDuty, CloudTrail), Azure"],
    ["Infrastructure as Code", "Terraform (modules, import, drift detection), tflint, tfsec, Checkov"],
    ["CI/CD & GitOps", "GitHub Actions, OIDC, release-please, Jenkins, ArgoCD"],
    ["Containers & Orchestration", "Docker, Amazon ECS, Kubernetes, HashiCorp Nomad, Vagrant"],
    ["Observability & SRE", "Prometheus, Grafana, OpenTelemetry, CloudWatch, Athena, incident response, DORA metrics"],
    ["Security", "IAM least privilege, secrets management, DevSecOps, ISO 27001, Linux namespaces, cgroups v2, seccomp"],
    ["Languages", "Go, Python, Bash, SQL, HCL, TypeScript"],
  ],
  fr: [
    ["Cloud", "AWS (ECS, Lambda, RDS PostgreSQL, S3, SQS, SNS, DynamoDB, CloudFront, WAF, ALB, Route 53, IAM, KMS, Secrets Manager, GuardDuty, CloudTrail), Azure"],
    ["Infrastructure as Code", "Terraform (modules, import, détection de drift), tflint, tfsec, Checkov"],
    ["CI/CD & GitOps", "GitHub Actions, OIDC, release-please, Jenkins, ArgoCD"],
    ["Conteneurs & orchestration", "Docker, Amazon ECS, Kubernetes, HashiCorp Nomad, Vagrant"],
    ["Observabilité & SRE", "Prometheus, Grafana, OpenTelemetry, CloudWatch, Athena, gestion d'incidents, métriques DORA"],
    ["Sécurité", "IAM moindre privilège, gestion des secrets, DevSecOps, ISO 27001, namespaces Linux, cgroups v2, seccomp"],
    ["Langages", "Go, Python, Bash, SQL, HCL, TypeScript"],
  ],
};
// "AWS (ECS, Lambda)" becomes a label followed by one chip per service.
const chip = (s) => {
  const m = s.match(/^(.*?)\s*\((.*)\)$/);
  if (!m) return `<span>${s}</span>`;
  return `<b>${m[1]}</b>${m[2].split(",").map((x) => `<span>${x.trim()}</span>`).join("")}<i class="br"></i>`;
};
function splitSkills(v) {
  const out = [];
  let depth = 0, cur = "";
  for (const ch of v) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
  }
  return [...out, cur.trim()].filter(Boolean);
}

document.getElementById("copyMail").onclick = async (e) => {
  try {
    await navigator.clipboard.writeText(EMAIL);
    e.target.textContent = UI[lang].copied;
    setTimeout(() => (e.target.textContent = UI[lang].copy), 1600);
  } catch { location.href = "mailto:" + EMAIL; }
};

langListeners.push(render);
initCapcom();
initControls(UI);
