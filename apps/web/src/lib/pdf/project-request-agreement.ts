export interface ProjectRequestAgreementPdfInput {
  projectName: string;
  services: string[];
  estimateLabel: string;
  overview: string;
  goals: string;
  budget: string;
  timeline: string;
  signerName: string;
  acceptedAtIso: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

function wrapText(doc: { splitTextToSize: (text: string, size: number) => string[] }, text: string, width: number): string[] {
  return doc.splitTextToSize(text || "—", width);
}

export async function buildProjectRequestAgreementPdf(
  input: ProjectRequestAgreementPdfInput
): Promise<{ fileName: string; contentBase64: string }> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const pad = 48;
  const contentWidth = width - pad * 2;
  const lime: [number, number, number] = [200, 241, 53];
  const dark: [number, number, number] = [15, 23, 42];
  const muted: [number, number, number] = [100, 116, 139];

  let y = 52;

  const addPageIfNeeded = (spaceNeeded: number) => {
    if (y + spaceNeeded <= height - 60) return;
    doc.addPage();
    y = 52;
  };

  const addSection = (title: string, body: string) => {
    addPageIfNeeded(70);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...dark);
    doc.text(title, pad, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    const lines = wrapText(doc, body, contentWidth);
    lines.forEach((line) => {
      addPageIfNeeded(18);
      doc.text(line, pad, y);
      y += 14;
    });
    y += 10;
  };

  doc.setFillColor(...dark);
  doc.rect(0, 0, width, 88, "F");
  doc.setFillColor(...lime);
  doc.rect(0, 0, width, 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("PROJECT REQUEST ENGAGEMENT AGREEMENT", pad, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(226, 232, 240);
  doc.text("Maphari Technologies · Digital acceptance record", pad, 60);

  y = 116;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pad, y, contentWidth, 90, 10, 10, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text("Project", pad + 18, y + 24);
  doc.text("Estimate", pad + 18, y + 48);
  doc.text("Timeline", pad + 18, y + 72);

  doc.setFont("helvetica", "normal");
  doc.text(input.projectName || "Project request", pad + 110, y + 24);
  doc.text(input.estimateLabel, pad + 110, y + 48);
  doc.text(input.timeline, pad + 110, y + 72);

  y += 120;

  addSection("Requested Services", input.services.length > 0 ? input.services.map((service) => "• " + service).join("\n") : "Service selection was not provided.");
  addSection("Business Overview", input.overview);
  addSection("Project Goals", input.goals);
  addSection("Budget Guidance", input.budget || "Budget to be confirmed during proposal review.");
  addSection(
    "Engagement Terms",
    "Maphari Technologies will review this request, confirm scope, and issue a tailored proposal. Any work outside the final approved scope requires a written change request. The indicative estimate attached to this request is not a final tax invoice and may change once discovery is complete.\n\nThe client acknowledges the 50% deposit requirement for project initiation, milestone billing for work in progress, and final settlement on delivery unless a different structure is agreed in the formal proposal.\n\nBy submitting this request, the client confirms that the information supplied is accurate and authorises Maphari Technologies to prepare a formal commercial proposal and supporting legal documents for review."
  );

  addPageIfNeeded(90);
  doc.setDrawColor(203, 213, 225);
  doc.line(pad, y, width - pad, y);
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text("Digitally accepted by", pad, y);
  y += 18;

  doc.setFont("times", "italic");
  doc.setFontSize(18);
  doc.text(input.signerName, pad, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  doc.text("Acceptance timestamp: " + input.acceptedAtIso, pad, y);

  const buffer = doc.output("arraybuffer");
  const contentBase64 = toBase64(new Uint8Array(buffer));
  const safeName = (input.projectName || "project-request").toLowerCase().replace(/[^a-z0-9._-]/g, "-");

  return {
    fileName: safeName + "-engagement-agreement.pdf",
    contentBase64,
  };
}
