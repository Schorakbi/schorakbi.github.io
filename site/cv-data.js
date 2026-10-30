// Generated from build/content.js by gen-site-cv.js. Do not edit by hand.
window.CV = {
 "en": {
  "name": "Mehdi Ziadi",
  "title": "DevOps & Cloud Infrastructure Engineer",
  "sections": [
   {
    "heading": "Summary",
    "paragraphs": [
     "DevOps and cloud infrastructure engineer, sole infrastructure owner at an AI SaaS startup. Migrated 1,600+ live AWS resources to Terraform, built keyless GitOps CI/CD, production observability and an LLM-powered incident investigator, and provisioned a multi-tenant AI agent platform with kernel-level isolation. Strong in AWS, Terraform, Go, Linux and security (ISO 27001)."
    ]
   },
   {
    "heading": "Skills",
    "skills": [
     [
      "Cloud",
      "AWS (ECS, Lambda, RDS PostgreSQL, S3, SQS, SNS, DynamoDB, CloudFront, WAF, ALB, Route 53, IAM, KMS, Secrets Manager, GuardDuty, CloudTrail), Azure"
     ],
     [
      "Infrastructure as Code",
      "Terraform (modules, import, drift detection), tflint, tfsec, Checkov"
     ],
     [
      "CI/CD & GitOps",
      "GitHub Actions, OIDC, release-please, Jenkins, ArgoCD"
     ],
     [
      "Containers & Orchestration",
      "Docker, Amazon ECS, Kubernetes, HashiCorp Nomad, Vagrant"
     ],
     [
      "Observability & SRE",
      "Prometheus, Grafana, OpenTelemetry, CloudWatch, Athena, incident response, DORA metrics"
     ],
     [
      "Security",
      "IAM least privilege, secrets management, DevSecOps, ISO 27001, Linux namespaces, cgroups v2, seccomp"
     ],
     [
      "Languages",
      "Go, Python, Bash, SQL, HCL, TypeScript"
     ]
    ]
   },
   {
    "heading": "Experience",
    "jobs": [
     {
      "role": "DevOps & Infrastructure Engineer",
      "org": "Sequesto (AI document-analysis SaaS)",
      "place": "Remote",
      "dates": "09/2025 - Present",
      "bullets": [
       "Own AWS infrastructure end to end as sole infrastructure engineer: migrated 1,625 hand-built production resources (ECS, RDS, Lambda, IAM, KMS, SQS) into Terraform across 7 roots and 3 AWS accounts. Author of 89% of 660 commits and 366 merged PRs.",
       "Replaced manual laptop applies with keyless GitOps on GitHub Actions: OIDC roles with least-privilege IAM, tflint/tfsec/Checkov on every PR, approval-gated production applies and daily drift detection, reaching 249 automated applies at 93% success with a 3-min median.",
       "Cut median merge-to-production lead time by 68% (91h to 29h) and failed deployments from 18% to 3% with the team, tracked on a DORA metrics dashboard I built in Grafana.",
       "Provisioned infrastructure for James, a multi-tenant AI agent platform in Go: ECS on EC2 with cgroup v2 delegation, user namespaces, per-tenant FUSE file systems, seccomp/Landlock hardening and Auth0-protected ingress, live in production since 10/2026.",
       "Built an LLM-powered incident investigator (Go, AWS Lambda, Claude API, read-only IAM) that opens a Slack thread per alarm, inspects ECS, logs, Prometheus metrics and PostgreSQL, and posts a root-cause verdict with customer impact.",
       "Built observability on Amazon Managed Prometheus, Grafana, OpenTelemetry and CloudWatch: 21 production alarms (crash loops, OOM, DLQ, 5xx, RDS) and PostgreSQL slow-query insight with pg_stat_statements.",
       "Hardened security for ISO 27001: time-boxed IAM access through a Slack approval bot with CloudTrail audit, secrets kept out of Terraform state, GuardDuty/WAF monitoring, branch protection as code, audit architecture documents.",
       "Built seqctl, a Go CLI that replaced ad-hoc scripts and automates daily infrastructure work: CI/CD change detection, environment scaffolding, secrets validation, database provisioning and incident tooling.",
       "Leading a 15-step plan to run the platform on a self-hosted HashiCorp Nomad stack outside AWS. Delivered step 1: a hardened single-VM Nomad cluster with ACLs and private-only listeners."
      ]
     },
     {
      "role": "DevOps Engineer Intern",
      "org": "MASS Analytics",
      "place": "Tunis, Tunisia",
      "dates": "02/2025 - 06/2025",
      "bullets": [
       "Built AWS monitoring dashboards and alerting that cut mean time to repair (MTTR) by 30%, automated deployments with Terraform to halve deployment time, and ran JMeter load tests to find performance bottlenecks."
      ]
     },
     {
      "role": "AI Engineer Intern",
      "org": "SMZ",
      "place": "Ben Arous, Tunisia",
      "dates": "07/2024 - 08/2024",
      "bullets": [
       "Built a multimodal AI tutor (web, video and image search with document Q&A) with a Next.js front end and FastAPI back end."
      ]
     }
    ]
   },
   {
    "heading": "Education",
    "twoLines": true,
    "edu": [
     {
      "degree": "Engineering Degree in ICT (Telecommunications)",
      "school": "National Engineering School of Tunis (ENIT)",
      "dates": "2022 - 2025"
     },
     {
      "degree": "Preparatory Cycle, Physics and Technology",
      "school": "Preparatory Institute for Engineering Studies of Nabeul (IPEIN)",
      "dates": "2020 - 2022"
     }
    ]
   },
   {
    "heading": "Languages",
    "paragraphs": [
     "Arabic (native), French (fluent), English (professional), German (elementary)"
    ]
   }
  ]
 },
 "fr": {
  "name": "Mehdi Ziadi",
  "title": "Ingénieur DevOps & Infrastructure Cloud",
  "sections": [
   {
    "heading": "Profil",
    "paragraphs": [
     "Ingénieur DevOps et infrastructure cloud, seul responsable de l'infrastructure d'une startup SaaS d'IA. J'ai migré plus de 1 600 ressources AWS de production vers Terraform, mis en place une CI/CD GitOps sans clés, l'observabilité de la production et un outil d'investigation d'incidents basé sur un LLM, et provisionné une plateforme d'agents IA multi-tenant avec isolation au niveau du noyau. Points forts : AWS, Terraform, Go, Linux et sécurité (ISO 27001)."
    ]
   },
   {
    "heading": "Compétences",
    "skills": [
     [
      "Cloud",
      "AWS (ECS, Lambda, RDS PostgreSQL, S3, SQS, SNS, DynamoDB, CloudFront, WAF, ALB, Route 53, IAM, KMS, Secrets Manager, GuardDuty, CloudTrail), Azure"
     ],
     [
      "Infrastructure as Code",
      "Terraform (modules, import, détection de drift), tflint, tfsec, Checkov"
     ],
     [
      "CI/CD & GitOps",
      "GitHub Actions, OIDC, release-please, Jenkins, ArgoCD"
     ],
     [
      "Conteneurs & orchestration",
      "Docker, Amazon ECS, Kubernetes, HashiCorp Nomad, Vagrant"
     ],
     [
      "Observabilité & SRE",
      "Prometheus, Grafana, OpenTelemetry, CloudWatch, Athena, gestion d'incidents, métriques DORA"
     ],
     [
      "Sécurité",
      "IAM moindre privilège, gestion des secrets, DevSecOps, ISO 27001, namespaces Linux, cgroups v2, seccomp"
     ],
     [
      "Langages",
      "Go, Python, Bash, SQL, HCL, TypeScript"
     ]
    ]
   },
   {
    "heading": "Expérience professionnelle",
    "jobs": [
     {
      "role": "Ingénieur DevOps & Infrastructure",
      "org": "Sequesto (SaaS d'analyse documentaire par IA)",
      "place": "Remote",
      "dates": "09/2025 - aujourd'hui",
      "bullets": [
       "Responsable de bout en bout de l'infrastructure AWS, seul ingénieur infra : migration de 1 625 ressources de production créées à la main (ECS, RDS, Lambda, IAM, KMS, SQS) vers Terraform, sur 7 roots et 3 comptes AWS. Auteur de 89 % des 660 commits et de 366 PR mergées.",
       "Remplacement des applies manuels depuis un poste local par un GitOps sans clés sur GitHub Actions : rôles OIDC à moindre privilège, tflint/tfsec/Checkov sur chaque PR, applies de production avec approbation et détection de drift quotidienne, soit 249 applies automatisés, 93 % de succès et 3 min en médiane.",
       "Réduction de 68 % du délai médian merge-production (de 91 h à 29 h) et des déploiements en échec de 18 % à 3 %, en équipe, suivis sur un tableau de bord DORA que j'ai construit dans Grafana.",
       "Provisionnement de l'infrastructure de James, plateforme d'agents IA multi-tenant en Go : ECS sur EC2 avec délégation cgroup v2, user namespaces, systèmes de fichiers FUSE par client, durcissement seccomp/Landlock et entrée protégée par Auth0, en production depuis 10/2026.",
       "Création d'un outil d'investigation d'incidents basé sur un LLM (Go, AWS Lambda, API Claude, IAM en lecture seule) : un fil Slack par alarme, analyse d'ECS, des logs, des métriques Prometheus et de PostgreSQL, puis diagnostic de cause racine avec impact client.",
       "Mise en place de l'observabilité avec Amazon Managed Prometheus, Grafana, OpenTelemetry et CloudWatch : 21 alarmes de production (crash loops, OOM, DLQ, 5xx, RDS) et analyse des requêtes lentes PostgreSQL avec pg_stat_statements.",
       "Renforcement de la sécurité pour l'ISO 27001 : accès IAM temporaires via un bot Slack d'approbation audité par CloudTrail, secrets hors de l'état Terraform, supervision GuardDuty/WAF, protection des branches en code, documentation d'architecture pour l'audit.",
       "Développement de seqctl, un CLI en Go qui remplace les scripts ad hoc et automatise l'exploitation : détection des changements en CI/CD, création d'environnements, validation des secrets, bases de données et outils d'incident.",
       "Pilotage d'un plan en 15 étapes pour faire tourner la plateforme sur une pile HashiCorp Nomad auto-hébergée, hors AWS. Étape 1 livrée : un cluster Nomad mono-VM durci, avec ACL et écoute sur réseau privé uniquement."
      ]
     },
     {
      "role": "Stagiaire Ingénieur DevOps",
      "org": "MASS Analytics",
      "place": "Tunis, Tunisie",
      "dates": "02/2025 - 06/2025",
      "bullets": [
       "Tableaux de bord de supervision AWS et alertes réduisant le temps moyen de résolution (MTTR) de 30 %, déploiements automatisés avec Terraform divisant par deux leur durée, et tests de charge JMeter pour identifier les goulots d'étranglement."
      ]
     },
     {
      "role": "Stagiaire Ingénieur IA",
      "org": "SMZ",
      "place": "Ben Arous, Tunisie",
      "dates": "07/2024 - 08/2024",
      "bullets": [
       "Tuteur IA multimodal (recherche web, vidéo et image, questions-réponses sur documents) avec un front-end Next.js et un back-end FastAPI."
      ]
     }
    ]
   },
   {
    "heading": "Formation",
    "edu": [
     {
      "degree": "Diplôme d'ingénieur en Télécommunications (TIC)",
      "school": "École Nationale d'Ingénieurs de Tunis (ENIT)",
      "dates": "2022 - 2025"
     },
     {
      "degree": "Cycle préparatoire, Physique-Technologie",
      "school": "Institut Préparatoire aux Études d'Ingénieurs de Nabeul (IPEIN)",
      "dates": "2020 - 2022"
     }
    ]
   },
   {
    "heading": "Langues",
    "paragraphs": [
     "Arabe (langue maternelle), français (courant), anglais (professionnel), allemand (notions)"
    ]
   }
  ]
 }
};
