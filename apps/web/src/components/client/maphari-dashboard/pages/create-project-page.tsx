import { useMemo, useState, type ChangeEvent } from "react";
import { cx, styles } from "../style";
import { formatDateShort } from "../utils";
import type {
  PortalFile,
  PortalProjectRequestAddonOption,
  PortalProjectRequestServiceOption
} from "../../../../lib/api/portal";
import flow from "../../../../app/style/components/create-project-flow.module.css";
import { createCx } from "@/lib/utils/cx";

const cxFlow = createCx(flow);

type ClientProjectRequestForm = {
  name: string;
  description: string;
  serviceType: "AUTO_RECOMMEND" | "WEBSITE" | "MOBILE_APP" | "AUTOMATION" | "UI_UX_DESIGN" | "OTHER";
  selectedServices: PortalProjectRequestServiceOption[];
  addonServices: PortalProjectRequestAddonOption[];
  buildMode: "AUTO" | "WORDPRESS" | "CUSTOM_CODE";
  complexity: "SIMPLE" | "STANDARD" | "ADVANCED";
  designPackage: "NONE" | "WIREFRAMES" | "WIREFRAMES_AND_UX";
  websitePageCount: string;
  appScreenCount: string;
  integrationsCount: string;
  targetPlatforms: Array<"WEB" | "IOS" | "ANDROID">;
  requiresContentSupport: boolean;
  requiresDomainAndHosting: boolean;
  scopePrompt: string;
  desiredStartAt: string;
  desiredDueAt: string;
  estimatedBudgetCents: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  agreementFileId: string;
};

const ADDON_OPTIONS: Array<{ value: PortalProjectRequestAddonOption; label: string; cost: string }> = [
  { value: "COPYWRITING_CONTENT", label: "Copywriting / Content", cost: "+R 60k" },
  { value: "ADVANCED_SEO", label: "Advanced SEO", cost: "+R 75k" },
  { value: "PERFORMANCE_OPTIMIZATION", label: "Performance Optimization", cost: "+R 55k" },
  { value: "TRAINING_HANDOFF", label: "Training & Handoff", cost: "+R 45k" },
  { value: "PRIORITY_SUPPORT", label: "Priority Support", cost: "+R 90k" },
  { value: "ADDITIONAL_QA_CYCLE", label: "Additional QA Cycle", cost: "+R 50k" },
  { value: "SECURITY_REVIEW", label: "Security Review", cost: "+R 80k" },
  { value: "ANALYTICS_DASHBOARD", label: "Analytics Dashboard", cost: "+R 65k" }
];

const SERVICE_CARDS: Array<{
  key: string;
  icon: string;
  name: string;
  desc: string;
  price: string;
  options: PortalProjectRequestServiceOption[];
}> = [
  {
    key: "web",
    icon: "🌐",
    name: "Web Development",
    desc: "Websites, portals, platforms, e-commerce, and custom web applications.",
    price: "From R 15,000",
    options: ["WEB_DEVELOPMENT", "WORDPRESS_DEVELOPMENT", "CUSTOM_WEB_APP_DEVELOPMENT", "ECOMMERCE_DEVELOPMENT", "CMS_IMPLEMENTATION"]
  },
  {
    key: "design",
    icon: "🎨",
    name: "UI/UX Design",
    desc: "Wireframes, UX flows, prototypes, and design systems.",
    price: "From R 8,000",
    options: ["UI_UX_DESIGN", "UX_RESEARCH_TESTING", "WIREFRAMING_PROTOTYPING", "BRANDING_VISUAL_IDENTITY"]
  },
  {
    key: "mobile",
    icon: "📱",
    name: "Mobile Application",
    desc: "iOS, Android, and cross-platform mobile applications.",
    price: "From R 35,000",
    options: ["MOBILE_APP_IOS", "MOBILE_APP_ANDROID", "MOBILE_APP_CROSS_PLATFORM"]
  },
  {
    key: "automation",
    icon: "⚡",
    name: "Automation",
    desc: "Workflows, CRM integration, API automation, and AI flows.",
    price: "From R 6,000",
    options: ["AUTOMATION_WORKFLOWS", "THIRD_PARTY_INTEGRATIONS", "RPA_LEGACY_AUTOMATION", "AI_LLM_AUTOMATIONS", "API_DEVELOPMENT"]
  },
  {
    key: "support",
    icon: "🔧",
    name: "Maintenance & Support",
    desc: "Retainer support for updates, optimization, and stability.",
    price: "From R 3,500/mo",
    options: ["MAINTENANCE_SUPPORT", "QA_TESTING", "SECURITY_COMPLIANCE", "DEVOPS_CI_CD_CLOUD"]
  },
  {
    key: "strategy",
    icon: "🧭",
    name: "Discovery & Consulting",
    desc: "Scoping, planning, technical advisory, and delivery roadmap.",
    price: "From R 5,000",
    options: ["DISCOVERY_CONSULTING", "DEDICATED_TEAM", "ANALYTICS_TRACKING", "SEO_TECHNICAL", "CONTENT_MIGRATION"]
  }
];

const INTEGRATION_OPTIONS = [
  "HubSpot",
  "Salesforce",
  "Stripe / Paystack",
  "Xero",
  "Slack",
  "Zapier",
  "Google Workspace",
  "Custom API"
];

const STEP_LABELS = ["Service", "Details", "Features", "Disclosure", "Agreement"] as const;

type ClientCreateProjectPageProps = {
  active: boolean;
  onClose: () => void;
  files: PortalFile[];
  uploadState: "idle" | "uploading" | "success" | "error";
  uploadMessage: string | null;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  projectRequestForm: ClientProjectRequestForm;
  onProjectRequestFormChange: (next: ClientProjectRequestForm) => void;
  onDownloadAgreementTemplate: () => void;
  onPreviewProjectRequest: () => void;
  submittingProjectRequest: boolean;
};

export function ClientCreateProjectPage({
  active,
  onClose,
  files,
  uploadState,
  uploadMessage,
  onFileUpload,
  projectRequestForm,
  onProjectRequestFormChange,
  onDownloadAgreementTemplate,
  onPreviewProjectRequest,
  submittingProjectRequest
}: ClientCreateProjectPageProps) {
  const fileInputId = "client-create-project-files-upload";
  const [requestStep, setRequestStep] = useState(1);
  const [integrationSelections, setIntegrationSelections] = useState<string[]>([]);

  const selectedServiceSet = useMemo(
    () => new Set(projectRequestForm.selectedServices),
    [projectRequestForm.selectedServices]
  );

  const selectedCard = useMemo(
    () => SERVICE_CARDS.find((card) => card.options.some((option) => selectedServiceSet.has(option))) ?? null,
    [selectedServiceSet]
  );

  const needsWebInputs =
    selectedServiceSet.has("WEB_DEVELOPMENT") ||
    selectedServiceSet.has("WORDPRESS_DEVELOPMENT") ||
    selectedServiceSet.has("CUSTOM_WEB_APP_DEVELOPMENT") ||
    selectedServiceSet.has("ECOMMERCE_DEVELOPMENT") ||
    selectedServiceSet.has("CMS_IMPLEMENTATION");

  const needsMobileInputs =
    selectedServiceSet.has("MOBILE_APP_IOS") ||
    selectedServiceSet.has("MOBILE_APP_ANDROID") ||
    selectedServiceSet.has("MOBILE_APP_CROSS_PLATFORM") ||
    selectedServiceSet.has("UI_UX_DESIGN");

  const needsIntegrationInputs =
    selectedServiceSet.has("THIRD_PARTY_INTEGRATIONS") ||
    selectedServiceSet.has("AUTOMATION_WORKFLOWS") ||
    selectedServiceSet.has("RPA_LEGACY_AUTOMATION") ||
    selectedServiceSet.has("AI_LLM_AUTOMATIONS") ||
    selectedServiceSet.has("API_DEVELOPMENT");

  const needsBuildMode =
    selectedServiceSet.has("WORDPRESS_DEVELOPMENT") || selectedServiceSet.has("WEB_DEVELOPMENT");

  const needsDesignPackage =
    selectedServiceSet.has("UI_UX_DESIGN") ||
    selectedServiceSet.has("WIREFRAMING_PROTOTYPING") ||
    selectedServiceSet.has("UX_RESEARCH_TESTING");

  const stepIsValid =
    requestStep === 1
      ? projectRequestForm.name.trim().length >= 2 &&
        projectRequestForm.selectedServices.length > 0 &&
        projectRequestForm.description.trim().length >= 12
      : requestStep === 2
      ? projectRequestForm.scopePrompt.trim().length >= 24 &&
        (!needsWebInputs || Number(projectRequestForm.websitePageCount) > 0) &&
        (!needsMobileInputs || Number(projectRequestForm.appScreenCount) > 0) &&
        (!needsIntegrationInputs || Number(projectRequestForm.integrationsCount) > 0) &&
        Boolean(projectRequestForm.desiredStartAt) &&
        Boolean(projectRequestForm.desiredDueAt) &&
        new Date(projectRequestForm.desiredDueAt).getTime() >= new Date(projectRequestForm.desiredStartAt).getTime()
      : requestStep === 3
      ? true
      : requestStep === 4
      ? projectRequestForm.requiresDomainAndHosting
      : projectRequestForm.agreementFileId.trim().length > 0;

  const stepWarnings: string[] = [];
  if (requestStep === 1) {
    if (projectRequestForm.name.trim().length < 2) stepWarnings.push("Project name must be at least 2 characters.");
    if (projectRequestForm.selectedServices.length === 0) stepWarnings.push("Select at least one service category.");
    if (projectRequestForm.description.trim().length < 12) stepWarnings.push("Project summary should be at least 12 characters.");
  }
  if (requestStep === 2) {
    if (projectRequestForm.scopePrompt.trim().length < 24) stepWarnings.push("Scope details should be at least 24 characters.");
    if (!projectRequestForm.desiredStartAt || !projectRequestForm.desiredDueAt)
      stepWarnings.push("Start and due date are required.");
    if (
      projectRequestForm.desiredStartAt &&
      projectRequestForm.desiredDueAt &&
      new Date(projectRequestForm.desiredDueAt).getTime() < new Date(projectRequestForm.desiredStartAt).getTime()
    ) {
      stepWarnings.push("Due date must be after start date.");
    }
  }
  if (requestStep === 4 && !projectRequestForm.requiresDomainAndHosting) {
    stepWarnings.push("Acknowledge the domain/hosting responsibility to continue.");
  }
  if (requestStep === 5 && !projectRequestForm.agreementFileId) {
    stepWarnings.push("Upload and select a signed agreement file.");
  }

  const budgetLabel =
    projectRequestForm.estimatedBudgetCents.trim().length > 0
      ? `R ${Number(projectRequestForm.estimatedBudgetCents).toLocaleString()}`
      : "Auto estimate";

  const handleSelectServiceCard = (cardKey: string) => {
    const card = SERVICE_CARDS.find((item) => item.key === cardKey);
    if (!card) return;
    onProjectRequestFormChange({
      ...projectRequestForm,
      selectedServices: card.options,
      serviceType: "OTHER"
    });
  };

  const toggleAddon = (addon: PortalProjectRequestAddonOption) => {
    const next = projectRequestForm.addonServices.includes(addon)
      ? projectRequestForm.addonServices.filter((value) => value !== addon)
      : [...projectRequestForm.addonServices, addon];
    onProjectRequestFormChange({ ...projectRequestForm, addonServices: next });
  };

  const togglePlatform = (platform: "WEB" | "IOS" | "ANDROID") => {
    const current = new Set(projectRequestForm.targetPlatforms);
    if (current.has(platform)) current.delete(platform);
    else current.add(platform);
    const nextPlatforms = Array.from(current);
    onProjectRequestFormChange({
      ...projectRequestForm,
      targetPlatforms: nextPlatforms.length > 0 ? nextPlatforms : ["WEB"]
    });
  };

  if (!active) return null;

  return (
    <div
      className={styles.projectModal}
      role="dialog"
      aria-modal="true"
      aria-label="New Project Request"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.projectModalCard}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div className={styles.projectModalHeader}>
          <div>
            <div className={styles.projectModalTitle}>New Project Request</div>
            <div className={styles.projectModalStep}>
              Step {requestStep} of 5 · {STEP_LABELS[requestStep - 1]}
            </div>
          </div>
          <button
            className={styles.projectModalClose}
            type="button"
            aria-label="Close modal"
            onClick={onClose}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Progress stepper ─────────────────────────────────── */}
        <div className={flow.stepper}>
          {STEP_LABELS.map((label, index) => {
            const stepIndex = index + 1;
            return (
              <div
                key={label}
                className={cxFlow("stepperItem", requestStep === stepIndex && "stepperActive", requestStep > stepIndex && "stepperDone")}
              >
                <span className={flow.stepperNum}>{stepIndex}</span>
                <span className={flow.stepperLabel}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* ── Body: form + live summary ─────────────────────────── */}
        <div className={styles.projectModalBody}>

          {/* Left: form content */}
          <div className={styles.projectModalLeft}>

            {/* STEP 1 — Service selection */}
            {requestStep === 1 ? (
              <div className={flow.stepBody}>
                <div className={flow.stepTitle}>What do you need built?</div>
                <div className={flow.stepSub}>Pick a service category, then fill in project basics.</div>

                <div className={flow.serviceGrid}>
                  {SERVICE_CARDS.map((card) => (
                    <button
                      key={card.key}
                      type="button"
                      className={cxFlow("serviceCard", selectedCard?.key === card.key && "serviceCardSelected")}
                      onClick={() => handleSelectServiceCard(card.key)}
                    >
                      <span className={flow.serviceIcon}>{card.icon}</span>
                      <div className={flow.serviceName}>{card.name}</div>
                      <div className={flow.serviceDesc}>{card.desc}</div>
                      <div className={flow.servicePrice}>{card.price}</div>
                    </button>
                  ))}
                </div>

                <div className={flow.formGrid2}>
                  <label className={flow.field}>
                    <span className={flow.fieldLabel}>Project Name *</span>
                    <input
                      className={styles.fieldInput}
                      aria-label="Project name"
                      placeholder="e.g. Customer Portal Rebuild"
                      value={projectRequestForm.name}
                      onChange={(event) =>
                        onProjectRequestFormChange({ ...projectRequestForm, name: event.target.value })
                      }
                    />
                  </label>
                  <label className={flow.field}>
                    <span className={flow.fieldLabel}>Project Summary *</span>
                    <input
                      className={styles.fieldInput}
                      aria-label="Project summary"
                      placeholder="One-line objective"
                      value={projectRequestForm.description}
                      onChange={(event) =>
                        onProjectRequestFormChange({ ...projectRequestForm, description: event.target.value })
                      }
                    />
                  </label>
                </div>

                {needsBuildMode ? (
                  <label className={flow.field}>
                    <span className={flow.fieldLabel}>Build Mode</span>
                    <select
                      className={styles.fieldInput}
                      aria-label="Website build mode"
                      value={projectRequestForm.buildMode}
                      onChange={(event) =>
                        onProjectRequestFormChange({
                          ...projectRequestForm,
                          buildMode: event.target.value as ClientProjectRequestForm["buildMode"]
                        })
                      }
                    >
                      <option value="AUTO">Auto</option>
                      <option value="WORDPRESS">WordPress</option>
                      <option value="CUSTOM_CODE">Custom Code</option>
                    </select>
                  </label>
                ) : null}
              </div>
            ) : null}

            {/* STEP 2 — Project details */}
            {requestStep === 2 ? (
              <div className={flow.stepBody}>
                <div className={flow.stepTitle}>Tell us about your project</div>
                <div className={flow.stepSub}>Detailed scope improves estimate quality and timelines.</div>

                <label className={flow.field}>
                  <span className={flow.fieldLabel}>Project Description *</span>
                  <textarea
                    className={styles.fieldInput}
                    aria-label="Detailed scope prompt"
                    style={{ minHeight: 110, resize: "vertical" }}
                    placeholder="Describe scope, users, references, and expected outcomes..."
                    value={projectRequestForm.scopePrompt}
                    onChange={(event) =>
                      onProjectRequestFormChange({ ...projectRequestForm, scopePrompt: event.target.value })
                    }
                  />
                </label>

                <div className={flow.formGrid3}>
                  {needsWebInputs ? (
                    <label className={flow.field}>
                      <span className={flow.fieldLabel}>Pages</span>
                      <input
                        className={styles.fieldInput}
                        aria-label="Estimated number of website pages"
                        placeholder="e.g. 8"
                        value={projectRequestForm.websitePageCount}
                        onChange={(event) =>
                          onProjectRequestFormChange({ ...projectRequestForm, websitePageCount: event.target.value })
                        }
                      />
                    </label>
                  ) : null}
                  {needsMobileInputs ? (
                    <label className={flow.field}>
                      <span className={flow.fieldLabel}>Screens</span>
                      <input
                        className={styles.fieldInput}
                        aria-label="Estimated number of app screens"
                        placeholder="e.g. 12"
                        value={projectRequestForm.appScreenCount}
                        onChange={(event) =>
                          onProjectRequestFormChange({ ...projectRequestForm, appScreenCount: event.target.value })
                        }
                      />
                    </label>
                  ) : null}
                  {needsIntegrationInputs ? (
                    <label className={flow.field}>
                      <span className={flow.fieldLabel}>Integrations</span>
                      <input
                        className={styles.fieldInput}
                        aria-label="Estimated number of integrations"
                        placeholder="e.g. 3"
                        value={projectRequestForm.integrationsCount}
                        onChange={(event) =>
                          onProjectRequestFormChange({ ...projectRequestForm, integrationsCount: event.target.value })
                        }
                      />
                    </label>
                  ) : null}
                </div>

                <div className={flow.formGrid2}>
                  <label className={flow.field}>
                    <span className={flow.fieldLabel}>Complexity</span>
                    <select
                      className={styles.fieldInput}
                      aria-label="Complexity"
                      value={projectRequestForm.complexity}
                      onChange={(event) =>
                        onProjectRequestFormChange({
                          ...projectRequestForm,
                          complexity: event.target.value as ClientProjectRequestForm["complexity"]
                        })
                      }
                    >
                      <option value="SIMPLE">Simple</option>
                      <option value="STANDARD">Standard</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </label>

                  {needsDesignPackage ? (
                    <label className={flow.field}>
                      <span className={flow.fieldLabel}>Design Package</span>
                      <select
                        className={styles.fieldInput}
                        aria-label="Design package"
                        value={projectRequestForm.designPackage}
                        onChange={(event) =>
                          onProjectRequestFormChange({
                            ...projectRequestForm,
                            designPackage: event.target.value as ClientProjectRequestForm["designPackage"]
                          })
                        }
                      >
                        <option value="NONE">None</option>
                        <option value="WIREFRAMES">Wireframes</option>
                        <option value="WIREFRAMES_AND_UX">Wireframes + UX</option>
                      </select>
                    </label>
                  ) : null}
                </div>

                <div className={flow.formGrid2}>
                  <label className={flow.field}>
                    <span className={flow.fieldLabel}>Start Date *</span>
                    <input
                      className={styles.fieldInput}
                      type="date"
                      aria-label="Desired start date"
                      value={projectRequestForm.desiredStartAt}
                      onChange={(event) =>
                        onProjectRequestFormChange({ ...projectRequestForm, desiredStartAt: event.target.value })
                      }
                    />
                  </label>
                  <label className={flow.field}>
                    <span className={flow.fieldLabel}>Due Date *</span>
                    <input
                      className={styles.fieldInput}
                      type="date"
                      aria-label="Desired due date"
                      value={projectRequestForm.desiredDueAt}
                      onChange={(event) =>
                        onProjectRequestFormChange({ ...projectRequestForm, desiredDueAt: event.target.value })
                      }
                    />
                  </label>
                </div>
              </div>
            ) : null}

            {/* STEP 3 — Features & add-ons */}
            {requestStep === 3 ? (
              <div className={flow.stepBody}>
                <div className={flow.stepTitle}>Select required features</div>
                <div className={flow.stepSub}>Choose add-ons and integrations for pricing accuracy.</div>

                <div className={flow.featureGrid}>
                  {ADDON_OPTIONS.map((addon) => {
                    const selected = projectRequestForm.addonServices.includes(addon.value);
                    return (
                      <button
                        key={addon.value}
                        type="button"
                        className={cxFlow("featureCard", selected && "featureCardSelected")}
                        onClick={() => toggleAddon(addon.value)}
                      >
                        <span>{addon.label}</span>
                        <span className={flow.featureCost}>{addon.cost}</span>
                      </button>
                    );
                  })}
                </div>

                <div className={flow.subLabel}>Integrations Needed</div>
                <div className={flow.pillWrap}>
                  {INTEGRATION_OPTIONS.map((item) => {
                    const selected = integrationSelections.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        className={cxFlow("pill", selected && "pillSelected")}
                        onClick={() => {
                          const next = selected
                            ? integrationSelections.filter((entry) => entry !== item)
                            : [...integrationSelections, item];
                          setIntegrationSelections(next);
                          onProjectRequestFormChange({
                            ...projectRequestForm,
                            integrationsCount: String(next.length || 1)
                          });
                        }}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>

                {needsMobileInputs ? (
                  <div>
                    <div className={flow.subLabel}>Target Platforms</div>
                    <div className={flow.pillWrap}>
                      {(["WEB", "IOS", "ANDROID"] as const).map((platform) => {
                        const selected = projectRequestForm.targetPlatforms.includes(platform);
                        return (
                          <button
                            key={platform}
                            type="button"
                            className={cxFlow("pill", selected && "pillSelected")}
                            onClick={() => togglePlatform(platform)}
                          >
                            {platform}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className={flow.formGrid2}>
                  <label className={flow.field}>
                    <span className={flow.fieldLabel}>Budget (ZAR)</span>
                    <input
                      className={styles.fieldInput}
                      aria-label="Estimated budget in ZAR"
                      placeholder="e.g. 35000"
                      value={projectRequestForm.estimatedBudgetCents}
                      onChange={(event) =>
                        onProjectRequestFormChange({
                          ...projectRequestForm,
                          estimatedBudgetCents: event.target.value
                        })
                      }
                    />
                  </label>
                  <label className={flow.field}>
                    <span className={flow.fieldLabel}>Priority</span>
                    <select
                      className={styles.fieldInput}
                      aria-label="Priority"
                      value={projectRequestForm.priority}
                      onChange={(event) =>
                        onProjectRequestFormChange({
                          ...projectRequestForm,
                          priority: event.target.value as "LOW" | "MEDIUM" | "HIGH"
                        })
                      }
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </label>
                </div>
              </div>
            ) : null}

            {/* STEP 4 — Disclosure */}
            {requestStep === 4 ? (
              <div className={flow.stepBody}>
                <div className={flow.stepTitle}>Important disclosure</div>
                <div className={flow.stepSub}>Read and acknowledge client-paid external costs before submission.</div>

                <div className={flow.disclosure}>
                  <div className={flow.disclosureTitle}>Client Responsibilities &amp; Exclusions</div>
                  <ul className={flow.disclosureList}>
                    <li>Domain registration and renewal fees</li>
                    <li>Hosting / cloud infrastructure costs</li>
                    <li>SSL certificates and third-party software licenses</li>
                    <li>External API usage costs</li>
                    <li>Stock media and paid assets not supplied by client</li>
                  </ul>
                  <label className={flow.ackRow}>
                    <input
                      type="checkbox"
                      checked={projectRequestForm.requiresDomainAndHosting}
                      onChange={(event) =>
                        onProjectRequestFormChange({
                          ...projectRequestForm,
                          requiresDomainAndHosting: event.target.checked
                        })
                      }
                    />
                    <span>I acknowledge these costs are client-paid and not included in the quote.</span>
                  </label>
                </div>
              </div>
            ) : null}

            {/* STEP 5 — Agreement upload */}
            {requestStep === 5 ? (
              <div className={flow.stepBody}>
                <div className={flow.stepTitle}>Sign and upload agreement</div>
                <div className={flow.stepSub}>Agreement upload is required before previewing quote and deposit.</div>

                <div className={flow.actionsRow}>
                  <button
                    className={cx("button", "buttonGhost")}
                    type="button"
                    onClick={onDownloadAgreementTemplate}
                  >
                    Download Agreement Template
                  </button>
                  <label htmlFor={fileInputId} className={cx("button", "buttonGhost")}>
                    Upload Signed File
                  </label>
                </div>

                <input
                  id={fileInputId}
                  type="file"
                  onChange={onFileUpload}
                  style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
                />

                <label className={flow.field}>
                  <span className={flow.fieldLabel}>Signed Agreement File *</span>
                  <select
                    className={styles.fieldInput}
                    aria-label="Signed agreement file"
                    value={projectRequestForm.agreementFileId}
                    onChange={(event) =>
                      onProjectRequestFormChange({ ...projectRequestForm, agreementFileId: event.target.value })
                    }
                  >
                    <option value="">Select signed agreement file</option>
                    {files.map((file) => (
                      <option key={file.id} value={file.id}>
                        {file.fileName}
                      </option>
                    ))}
                  </select>
                </label>

                {uploadState !== "idle" ? (
                  <div className={flow.uploadMsg}>
                    {uploadState === "uploading" ? "Uploading file..." : (uploadMessage ?? "Upload complete")}
                  </div>
                ) : null}

                {files.length > 0 ? (
                  <div className={flow.recentFiles}>
                    {files.slice(0, 4).map((file) => (
                      <div key={file.id} className={flow.fileRow}>
                        <span>{file.fileName}</span>
                        <span>{formatDateShort(file.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Validation warnings */}
            {!stepIsValid && stepWarnings.length > 0 ? (
              <div className={flow.warnBox} role="alert" aria-live="polite">
                {stepWarnings.map((warning) => (
                  <div key={warning}>• {warning}</div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Right: live summary panel */}
          <div className={styles.projectModalRight}>
            <div className={styles.summaryTitle}>Live Summary</div>

            {selectedCard ? (
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Service</span>
                <span className={styles.summaryVal}>
                  {selectedCard.icon} {selectedCard.name}
                </span>
              </div>
            ) : (
              <div className={styles.summaryEmptyHint}>
                Select a service on step 1 to build your summary.
              </div>
            )}

            {projectRequestForm.name ? (
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Project</span>
                <span className={styles.summaryVal}>{projectRequestForm.name}</span>
              </div>
            ) : null}

            {projectRequestForm.complexity && projectRequestForm.complexity !== "STANDARD" ? (
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Complexity</span>
                <span className={styles.summaryVal}>{projectRequestForm.complexity}</span>
              </div>
            ) : null}

            {projectRequestForm.desiredStartAt ? (
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Start</span>
                <span className={styles.summaryVal}>{formatDateShort(projectRequestForm.desiredStartAt)}</span>
              </div>
            ) : null}

            {projectRequestForm.desiredDueAt ? (
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Due</span>
                <span className={styles.summaryVal}>{formatDateShort(projectRequestForm.desiredDueAt)}</span>
              </div>
            ) : null}

            {projectRequestForm.priority !== "MEDIUM" ? (
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>Priority</span>
                <span className={styles.summaryVal}>{projectRequestForm.priority}</span>
              </div>
            ) : null}

            <div className={styles.summaryDivider} />

            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Est. Budget</span>
              <span className={styles.summaryBudget}>{budgetLabel}</span>
            </div>

            {projectRequestForm.addonServices.length > 0 ? (
              <>
                <div className={styles.summaryDivider} />
                <div className={styles.summaryKey} style={{ marginBottom: 8 }}>
                  Add-ons ({projectRequestForm.addonServices.length})
                </div>
                {ADDON_OPTIONS.filter((addon) =>
                  projectRequestForm.addonServices.includes(addon.value)
                ).map((addon) => (
                  <div key={addon.value} className={styles.summaryAddon}>
                    <span>{addon.label}</span>
                    <span className={styles.summaryAddonCost}>{addon.cost}</span>
                  </div>
                ))}
              </>
            ) : null}

            {integrationSelections.length > 0 ? (
              <>
                <div className={styles.summaryDivider} />
                <div className={styles.summaryRow}>
                  <span className={styles.summaryKey}>Integrations</span>
                  <span className={styles.summaryVal}>{integrationSelections.join(", ")}</span>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* ── Footer: navigation ───────────────────────────────── */}
        <div className={styles.projectModalFooter}>
          <button
            type="button"
            className={cx("button", "buttonGhost")}
            onClick={() => setRequestStep((step) => Math.max(1, step - 1))}
            disabled={requestStep === 1}
          >
            Back
          </button>

          {requestStep < 5 ? (
            <button
              type="button"
              className={cx("button", "buttonAccent")}
              onClick={() => setRequestStep((step) => Math.min(5, step + 1))}
              disabled={!stepIsValid}
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              className={cx("button", "buttonAccent")}
              onClick={onPreviewProjectRequest}
              disabled={!stepIsValid || submittingProjectRequest}
            >
              {submittingProjectRequest ? "Submitting..." : "Review Estimate & Terms"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
