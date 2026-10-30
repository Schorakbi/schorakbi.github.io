// CAPCOM loop: answers questions from pre-written runbooks, in English and French.
// Every fact comes from the CV (build/content.js). Keep them in sync.

// French typography: a space before : ; ! ? % never breaks the line.
const nb = (s) => (lang === "fr" ? s.replace(/ ([:;!?%»])/g, " $1").replace(/« /g, "« ") : s);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const commsWait = (ms) => (reduceMotion ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));

// Contact buttons, shared with the game's arrival screen.
const actions = () => {
  const other = lang === "en" ? "fr" : "en";
  const lab = lang === "en"
    ? { cv: "Download CV", other: "CV in French", mail: "Email" }
    : { cv: "Télécharger le CV", other: "CV en anglais", mail: "E-mail" };
  return `<div class="row-btns">
    <a class="btn" href="${CV_PDF[lang]}" download>${lab.cv}</a>
    <a class="btn line" href="${CV_PDF[other]}" download>${lab.other}</a>
    <a class="btn line" href="mailto:${EMAIL}">${lab.mail}</a>
    <a class="btn line" href="${LINKS.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
    <a class="btn line" href="${LINKS.github}" target="_blank" rel="noopener">GitHub</a></div>`;
};
const YOU = { en: "YOU", fr: "VOUS" };

// First match wins, so specific topics come before broad ones. Keys cover both languages.
const RUNBOOKS = [
  { keys: ["james", "isolation", "cgroup", "namespace", "tenant", "fuse", "sandbox", "kernel", "noyau"], chip: { en: "Tell me about James", fr: "Parle-moi de James" }, a: {
    en: "<p>James is a multi-tenant AI agent platform. Each tenant's agent runs in its own sandbox, so the hard part was isolation on shared hosts.</p><p>Mehdi provisioned ECS on EC2 with <code>cgroup v2</code> delegation for per-tenant resource limits, user namespaces so root in a container is not root on the host, per-tenant FUSE file systems, and seccomp and Landlock to restrict syscalls and file access. Ingress sits behind Auth0. In production since 10/2026.</p>",
    fr: "<p>James est une plateforme d'agents IA multi-tenant. L'agent de chaque client tourne dans son propre bac à sable, donc le vrai défi était l'isolation sur des hôtes partagés.</p><p>Mehdi a provisionné ECS sur EC2 avec délégation <code>cgroup v2</code> pour limiter les ressources par client, des user namespaces pour que root dans un conteneur ne soit pas root sur l'hôte, des systèmes de fichiers FUSE par client, et seccomp et Landlock pour restreindre les appels système et l'accès aux fichiers. L'entrée est protégée par Auth0. En production depuis 10/2026.</p>" } },
  { keys: ["investigat", "llm", "claude", "incident", "alarm", "alarme"], a: {
    en: "<p>His incident investigator runs on AWS Lambda in Go, with read-only IAM. When an alarm fires it opens a Slack thread, inspects ECS, logs, Prometheus metrics and PostgreSQL, and asks the Claude API for a root-cause verdict with customer impact.</p>",
    fr: "<p>Son investigateur d'incidents tourne sur AWS Lambda, en Go, avec un IAM en lecture seule. Quand une alarme se déclenche, il ouvre un fil Slack, analyse ECS, les logs, les métriques Prometheus et PostgreSQL, puis demande à l'API Claude un diagnostic de cause racine avec l'impact client.</p>" } },
  { keys: ["seqctl", "cli"], a: {
    en: "<p><code>seqctl</code> is a Go CLI Mehdi wrote to replace a pile of ad-hoc scripts: CI/CD change detection (which environments a PR affects), environment scaffolding, secrets validation, database provisioning and incident tooling. The pipelines call it directly.</p>",
    fr: "<p><code>seqctl</code> est un CLI en Go que Mehdi a écrit pour remplacer une pile de scripts ad hoc : détection des changements en CI/CD (quels environnements une PR touche), création d'environnements, validation des secrets, bases de données et outils d'incident. Les pipelines l'appellent directement.</p>" } },
  { keys: ["nomad", "self-host", "self host", "auto-héberg", "portab", "multi-cloud", "vendor"], a: {
    en: "<p>He built a hardened single-VM HashiCorp Nomad cluster with ACLs and private-only listeners, for running workloads on self-hosted infrastructure outside AWS.</p>",
    fr: "<p>Il a construit un cluster HashiCorp Nomad mono-VM durci, avec ACL et écoute sur réseau privé uniquement, pour faire tourner des charges sur une infrastructure auto-hébergée, hors AWS.</p>" } },
  { keys: ["terraform", "iac", "infrastructure as code", "migrat", "import"], a: {
    en: "<p>He took over production built by hand in the AWS console and imported it into Terraform: 1,625 resources across 7 roots and 3 AWS accounts, without rebuilding anything. tflint, tfsec and Checkov run on every PR, and drift detection runs daily.</p>",
    fr: "<p>Il a repris une production créée à la main dans la console AWS et l'a importée dans Terraform : 1 625 ressources sur 7 roots et 3 comptes AWS, sans rien reconstruire. tflint, tfsec et Checkov tournent sur chaque PR, et la détection de drift chaque jour.</p>" } },
  { keys: ["ci", "cd", "pipeline", "deploy", "déploi", "github actions", "gitops", "dora", "oidc"], a: {
    en: "<p>Deploys moved from laptops to keyless GitHub Actions pipelines: OIDC roles instead of stored AWS keys, scanning on every PR, approval-gated production applies. 249 automated applies at 93% success, 3-minute median.</p><p>With the team, merge-to-production lead time went from 91h to 29h and failed deployments from 18% to 3%, tracked on a DORA dashboard he built in Grafana.</p>",
    fr: "<p>Les déploiements sont passés des portables à des pipelines GitHub Actions sans clés : rôles OIDC au lieu de clés AWS stockées, analyse sur chaque PR, applies de production avec approbation. 249 applies automatisés, 93 % de succès, 3 min en médiane.</p><p>En équipe, le délai merge-production est passé de 91 h à 29 h et les déploiements en échec de 18 % à 3 %, suivis sur un tableau de bord DORA qu'il a construit dans Grafana.</p>" } },
  { keys: ["monitor", "supervision", "observab", "prometheus", "grafana", "alert", "opentelemetry", "sre", "on call", "on-call", "astreinte"], a: {
    en: "<p>Observability runs on Amazon Managed Prometheus, Grafana, OpenTelemetry and CloudWatch, with 21 production alarms (crash loops, OOM, DLQ, 5xx, RDS) and PostgreSQL slow-query insight. Every alarm goes to the AI investigator first.</p>",
    fr: "<p>L'observabilité repose sur Amazon Managed Prometheus, Grafana, OpenTelemetry et CloudWatch, avec 21 alarmes de production (crash loops, OOM, DLQ, 5xx, RDS) et l'analyse des requêtes lentes PostgreSQL. Chaque alarme passe d'abord par l'investigateur IA.</p>" } },
  { keys: ["security", "sécurité", "securite", "iso", "iam", "compliance", "audit", "secret"], a: {
    en: "<p>He supported the ISO 27001 audit: time-boxed IAM access approved in Slack with a CloudTrail trail, secrets kept out of Terraform state, GuardDuty and WAF monitoring, and branch protection managed as code.</p>",
    fr: "<p>Il a accompagné l'audit ISO 27001 : accès IAM temporaires approuvés dans Slack et tracés par CloudTrail, secrets hors de l'état Terraform, supervision GuardDuty et WAF, et protection des branches gérée en code.</p>" } },
  { keys: ["kubernetes", "k8s", "argo", "azure", "aks", "helm"], a: {
    en: "<p>At work he runs containers on Amazon ECS and HashiCorp Nomad. For Kubernetes, he built a microservices CI/CD project on Azure: AKS, Azure DevOps pipelines and GitOps with ArgoCD.</p>",
    fr: "<p>Au travail, il fait tourner les conteneurs sur Amazon ECS et HashiCorp Nomad. Côté Kubernetes, il a réalisé un projet CI/CD de microservices sur Azure : AKS, pipelines Azure DevOps et GitOps avec ArgoCD.</p>" } },
  { keys: ["stack", "skill", "compétence", "competence", "tool", "outil", "tech", "golang", "go", "python", "aws"], chip: { en: "What's your stack?", fr: "Quelle est ta stack ?" }, a: {
    en: "<p><b>Cloud</b> AWS (ECS, Lambda, RDS PostgreSQL, S3, SQS, SNS, DynamoDB, CloudFront, WAF, ALB, Route 53, IAM, KMS, Secrets Manager, GuardDuty, CloudTrail), Azure<br><b>IaC</b> Terraform, tflint, tfsec, Checkov<br><b>CI/CD</b> GitHub Actions, OIDC, release-please, Jenkins, ArgoCD<br><b>Containers</b> Docker, ECS, Kubernetes, Nomad<br><b>Observability</b> Prometheus, Grafana, OpenTelemetry, CloudWatch<br><b>Code</b> Go, Python, Bash, SQL, HCL, TypeScript</p>",
    fr: "<p><b>Cloud</b> AWS (ECS, Lambda, RDS PostgreSQL, S3, SQS, SNS, DynamoDB, CloudFront, WAF, ALB, Route 53, IAM, KMS, Secrets Manager, GuardDuty, CloudTrail), Azure<br><b>IaC</b> Terraform, tflint, tfsec, Checkov<br><b>CI/CD</b> GitHub Actions, OIDC, release-please, Jenkins, ArgoCD<br><b>Conteneurs</b> Docker, ECS, Kubernetes, Nomad<br><b>Observabilité</b> Prometheus, Grafana, OpenTelemetry, CloudWatch<br><b>Code</b> Go, Python, Bash, SQL, HCL, TypeScript</p>" } },
  { keys: ["reloc", "move", "visa", "abroad", "remote", "where", "location", "country", "mobilit", "étranger", "etranger", "pays", "déménag", "télétravail"], chip: { en: "Open to relocation?", fr: "Mobilité internationale ?" }, a: {
    en: "<p>Yes. Mehdi is based in Tunis and is looking to relocate. He works in English and French, and has elementary German.</p>",
    fr: "<p>Oui. Mehdi est basé à Tunis et souhaite s'installer à l'étranger. Il travaille en français et en anglais, et a des notions d'allemand.</p>" } },
  { keys: ["background", "education", "study", "school", "degree", "enit", "university", "ipein", "formation", "études", "etudes", "école", "ecole", "diplôme", "diplome", "parcours"], chip: { en: "Your background?", fr: "Ton parcours ?" }, a: {
    en: "<p>Engineering Degree in ICT (Telecommunications) from the National Engineering School of Tunis (ENIT), 2022 to 2025, after the Preparatory Cycle in Physics and Technology at IPEIN, Nabeul.</p><p>Before SEQUESTO: DevOps Engineer Intern at MASS Analytics (AWS monitoring and alerting, Terraform, JMeter load tests) and AI Engineer Intern at SMZ (a multimodal AI tutor).</p>",
    fr: "<p>Diplôme d'ingénieur en Télécommunications (TIC) de l'École Nationale d'Ingénieurs de Tunis (ENIT), 2022 à 2025, après le cycle préparatoire Physique-Technologie à l'IPEIN, Nabeul.</p><p>Avant SEQUESTO : stagiaire ingénieur DevOps chez MASS Analytics (supervision et alertes AWS, Terraform, tests de charge JMeter) et stagiaire ingénieur IA chez SMZ (un tuteur IA multimodal).</p>" } },
  { keys: ["experience", "expérience", "intern", "stage", "mass", "smz", "career", "carrière", "job", "poste", "sequesto"], a: {
    en: "<p><b>SEQUESTO</b>, DevOps & Infrastructure Engineer, since 09/2025, sole infrastructure engineer for an AI SaaS.<br><b>MASS Analytics</b>, DevOps Engineer Intern, 02/2025 to 06/2025.<br><b>SMZ</b>, AI Engineer Intern, 07/2024 to 08/2024.</p>",
    fr: "<p><b>SEQUESTO</b>, ingénieur DevOps & infrastructure depuis 09/2025, seul ingénieur infra d'un SaaS d'IA.<br><b>MASS Analytics</b>, stagiaire ingénieur DevOps, 02/2025 à 06/2025.<br><b>SMZ</b>, stagiaire ingénieur IA, 07/2024 à 08/2024.</p>" } },
  { keys: ["french", "english", "german", "arabic", "speak", "language", "langue", "français", "anglais", "allemand", "arabe", "parle"], a: {
    en: "<p>Arabic (native), French (fluent), English (professional), German (elementary).</p>",
    fr: "<p>Arabe (langue maternelle), français (courant), anglais (professionnel), allemand (notions).</p>" } },
  { keys: ["reach", "contact", "email", "e-mail", "mail", "hire", "recrut", "interview", "entretien", "cv", "resume", "call", "talk", "joindre"], chip: { en: "How do I reach you?", fr: "Comment te contacter ?" }, a: {
    en: () => `<p>Fastest is email: <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>${actions()}`,
    fr: () => `<p>Le plus rapide, c'est l'e-mail : <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>${actions()}` } },
  { keys: ["hello", "hi", "hey", "bonjour", "salut", "coucou"], a: {
    en: "<p>CAPCOM here, reading you loud and clear. Ask about James, the stack, Terraform, CI/CD, monitoring, or how to reach Mehdi.</p>",
    fr: "<p>Ici CAPCOM, je vous reçois cinq sur cinq. Posez vos questions sur James, la stack, Terraform, la CI/CD, la supervision, ou comment joindre Mehdi.</p>" } },
];
const FALLBACK = {
  en: () => `<p>Nothing on the loop for that yet. Try a suggestion above, or ask Mehdi directly: <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>`,
  fr: () => `<p>Rien sur la boucle à ce sujet pour l'instant. Essayez une suggestion ci-dessus, ou écrivez directement à Mehdi : <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>`,
};

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function match(q) {
  const s = " " + norm(q).replace(/[^a-z0-9+\-' ]/g, " ") + " ";
  return RUNBOOKS.find((r) => r.keys.some((k) => {
    const n = norm(k);
    return n.length <= 3 ? s.includes(" " + n + " ") : s.includes(n);
  }));
}

const commsLog = document.getElementById("commsLog");
const answer = (r) => {
  const a = r ? r.a[lang] : FALLBACK[lang];
  return nb(typeof a === "function" ? a() : a);
};

function say(who, html, isYou) {
  const line = el("div", "cl");
  line.append(el("span", "who" + (isYou ? "" : " flight"), who), el("div", null, html));
  commsLog.append(line);
  commsLog.scrollTop = commsLog.scrollHeight;
  return line;
}

async function ask(q) {
  q = q.trim();
  if (!q) return;
  const you = say(YOU[lang], "", true);
  you.lastChild.textContent = q;
  const dots = el("div", "typing", "<i></i><i></i><i></i>");
  dots.style.padding = "14px 0";
  commsLog.append(dots);
  commsLog.scrollTop = commsLog.scrollHeight;
  await commsWait(600);
  dots.remove();
  say("CAPCOM", answer(match(q)));
}

function renderChips() {
  document.getElementById("chips").replaceChildren(...RUNBOOKS.filter((r) => r.chip).map((r) => {
    const b = el("button", "chip", nb(r.chip[lang]));
    b.type = "button";
    b.onclick = () => ask(r.chip[lang]);
    return b;
  }));
}


document.getElementById("ask").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = document.getElementById("q");
  ask(q.value);
  q.value = "";
});

function initCapcom() {
  langListeners.push(renderChips);
  say("CAPCOM", nb(lang === "en"
    ? "<p>Loop is open. Pick a suggestion or type your own question.</p>"
    : "<p>La boucle est ouverte. Choisissez une suggestion ou tapez votre question.</p>"));
}
