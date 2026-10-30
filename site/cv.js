// Plain CV page, rendered from cv-data.js (generated from the same source as the PDFs).

const UI = {
  title: { en: "Mehdi Ziadi · CV", fr: "Mehdi Ziadi · CV" },
  en: { back: "← Back to home", kicker: "Crew file", loc: "Tunis, Tunisia · Open to relocation", pdf: "Download PDF", other: "French version (PDF)" },
  fr: { back: "← Retour à l'accueil", kicker: "Dossier d'équipage", loc: "Tunis, Tunisie · Mobilité internationale", pdf: "Télécharger le PDF", other: "Version anglaise (PDF)" },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function render() {
  const d = CV[lang], u = UI[lang], other = lang === "en" ? "fr" : "en";
  let h = `<header class="cv-head">
    <p class="kicker mono">${u.kicker}</p>
    <h1>${esc(d.name)}</h1>
    <p class="cv-title">${esc(d.title)}</p>
    <p class="cv-contact mono">${u.loc} · <a href="mailto:${EMAIL}">${EMAIL}</a> · <a href="${LINKS.linkedin}">linkedin.com/in/mehdi-ziadi</a> · <a href="${LINKS.github}">github.com/Schorakbi</a></p>
    <div class="row-btns"><a class="btn" href="${CV_PDF[lang]}" download>${u.pdf}</a><a class="btn line" href="${CV_PDF[other]}" download>${u.other}</a></div>
  </header>`;
  for (const s of d.sections) {
    h += `<section class="cv-sec"><h2 class="cv-h mono">${esc(s.heading)}</h2><div>`;
    (s.paragraphs || []).forEach((p) => (h += `<p>${esc(p)}</p>`));
    if (s.skills) h += `<dl class="skills">${s.skills.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`;
    (s.jobs || []).forEach((j) => (h += `<article class="job">
      <div class="job-top"><h3>${esc(j.role)}</h3><span class="mono when">${esc(j.dates)}</span></div>
      <p class="org">${esc(j.org)} · ${esc(j.place)}</p>
      <ul>${j.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></article>`));
    (s.edu || []).forEach((e) => (h += `<article class="job">
      <div class="job-top"><h3>${esc(e.degree)}</h3><span class="mono when">${esc(e.dates)}</span></div>
      <p class="org">${esc(e.school)}</p></article>`));
    h += `</div></section>`;
  }
  document.getElementById("cv").innerHTML = h;
}

langListeners.push(render);
initControls(UI);
