import { useMemo, useState, type ChangeEvent } from "react";
import { cx, styles } from "../style";
import { formatDateShort } from "../utils";
import type {
  PortalFile,
  PortalProjectRequestAddonOption,
  PortalProjectRequestServiceOption
} from "../../../../lib/api/portal";
import flow from "./create-project-flow.module.css";

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
  { value: "COPYWRITING_CONTENT", label: "Copywriting / Content", cost: "+60,000" },
  { value: "ADVANCED_SEO", label: "Advanced SEO", cost: "+75,000" },
  { value: "PERFORMANCE_OPTIMIZATION", label: "Performance Optimization", cost: "+55,000" },
  { value: "TRAINING_HANDOFF", label: "Training & Handoff Session", cost: "+45,000" },
  { value: "PRIORITY_SUPPORT", label: "Priority Support", cost: "+90,000" },
  { value: "ADDITIONAL_QA_CYCLE", label: "Additional QA Cycle", cost: "+50,000" },
  { value: "SECURITY_REVIEW", label: "Security Review", cost: "+80,000" },
  { value: "ANALYTICS_DASHBOARD", label: "Analytics Dashboard", cost: "+65,000" }
];

const SERVICE_CARDS: Array<{ key: string; icon: string; name: string; desc: string; price: string; options: PortalProjectRequestServiceOption[] }> = [
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

const INTEGRATION_OPTIONS = ["HubSpot", "Salesforce", "Stripe / Paystack", "Xero", "Slack", "Zapier", "Google Workspace", "Custom API"];

type ClientCreateProjectPageProps = {
  active: boolean;
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

  const selectedServiceSet = useMemo(() => new Set(projectRequestForm.selectedServices), [projectRequestForm.selectedServices]);
  const selectedCardKey = useMemo(
    () => SERVICE_CARDS.find((card) => card.options.some((option) => selectedServiceSet.has(option)))?.key ?? null,
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
  const needsBuildMode = selectedServiceSet.has("WORDPRESS_DEVELOPMENT") || selectedServiceSet.has("WEB_DEVELOPMENT");
  const needsDesignPackage =
    selectedServiceSet.has("UI_UX_DESIGN") || selectedServiceSet.has("WIREFRAMING_PROTOTYPING") || selectedServiceSet.has("UX_RESEARCH_TESTING");

  const stepIsValid =
    requestStep === 1
      ? projectRequestForm.name.trim().length >= 2 && projectRequestForm.selectedServices.length > 0 && projectRequestForm.description.trim().length >= 12
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
    if (!projectRequestForm.desiredStartAt || !projectRequestForm.desiredDueAt) stepWarnings.push("Start and due date are required.");
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

  const budgetHintLabel = projectRequestForm.estimatedBudgetCents.trim().length > 0
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

  return (
    <section className={cx("page", active && "pageActive")} id="page-create-project">
      <div className={styles.pageHeader} id="tour-page-create">
        <div>
          <div className={styles.pageEyebrow}>Project Intake</div>
          <div className={styles.pageTitle}>Request New Project</div>
          <div className={styles.pageSub}>Structured flow for pricing, disclosure, agreement, and deposit.</div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>New Project Request</span>
          <span className={styles.pageSub}>Step {requestStep} of 5</span>
        </div>

        <div className={flow.stepper}>
          {["Service", "Details", "Features", "Disclosure", "Agreement"].map((label, index) => {
            const stepIndex = index + 1;
            return (
              <div
                key={label}
                className={`${flow.stepperItem} ${requestStep === stepIndex ? flow.stepperActive : ""} ${requestStep > stepIndex ? flow.stepperDone : ""}`}
              >
                <span className={flow.stepperNum}>{stepIndex}</span>
                <span className={flow.stepperLabel}>{label}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.cardBody}>
          {requestStep === 1 ? (
            <div className={flow.stepBody}>
              <div className={flow.stepTitle}>What do you need built?</div>
              <div className={flow.stepSub}>Pick a service category, then add project basics.</div>

              <div className={flow.serviceGrid}>
                {SERVICE_CARDS.map((card) => (
                  <button
                    key={card.key}
                    type="button"
                    className={`${flow.serviceCard} ${selectedCardKey === card.key ? flow.serviceCardSelected : ""}`}
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
                    onChange={(event) => onProjectRequestFormChange({ ...projectRequestForm, name: event.target.value })}
                  />
                </label>
                <label className={flow.field}>
                  <span className={flow.fieldLabel}>Project Summary *</span>
                  <input
                    className={styles.fieldInput}
                    aria-label="Project summary"
                    placeholder="One-line objective"
                    value={projectRequestForm.description}
                    onChange={(event) => onProjectRequestFormChange({ ...projectRequestForm, description: event.target.value })}
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

          {requestStep === 2 ? (
            <div className={flow.stepBody}>
              <div className={flow.stepTitle}>Tell us about your project</div>
              <div className={flow.stepSub}>Detailed scope improves estimate quality and timelines.</div>

              <label className={flow.field}>
                <span className={flow.fieldLabel}>Project Description *</span>
                <textarea
                  className={styles.fieldInput}
                  aria-label="Detailed scope prompt"
                  style={{ minHeight: 120, resize: "vertical" }}
                  placeholder="Describe scope, users, references, and expected outcomes..."
                  value={projectRequestForm.scopePrompt}
                  onChange={(event) => onProjectRequestFormChange({ ...projectRequestForm, scopePrompt: event.target.value })}
                />
              </label>

              <div className={flow.formGrid3}>
                {needsWebInputs ? (
                  <label className={flow.field}>
                    <span className={flow.fieldLabel}>Pages</span>
                    <input
                      className={styles.fieldInput}
                      aria-label="Estimated number of website pages"
                      value={projectRequestForm.websitePageCount}
                      onChange={(event) => onProjectRequestFormChange({ ...projectRequestForm, websitePageCount: event.target.value })}
                    />
                  </label>
                ) : null}
                {needsMobileInputs ? (
                  <label className={flow.field}>
                    <span className={flow.fieldLabel}>Screens</span>
                    <input
                      className={styles.fieldInput}
                      aria-label="Estimated number of app screens"
                      value={projectRequestForm.appScreenCount}
                      onChange={(event) => onProjectRequestFormChange({ ...projectRequestForm, appScreenCount: event.target.value })}
                    />
                  </label>
                ) : null}
                {needsIntegrationInputs ? (
                  <label className={flow.field}>
                    <span className={flow.fieldLabel}>Integrations</span>
                    <input
                      className={styles.fieldInput}
                      aria-label="Estimated number of integrations"
                      value={projectRequestForm.integrationsCount}
                      onChange={(event) => onProjectRequestFormChange({ ...projectRequestForm, integrationsCount: event.target.value })}
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
                      onProjectRequestFormChange({ ...projectRequestForm, complexity: event.target.value as ClientProjectRequestForm["complexity"] })
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
                    onChange={(event) => onProjectRequestFormChange({ ...projectRequestForm, desiredStartAt: event.target.value })}
                  />
                </label>
                <label className={flow.field}>
                  <span className={flow.fieldLabel}>Due Date *</span>
                  <input
                    className={styles.fieldInput}
                    type="date"
                    aria-label="Desired due date"
                    value={projectRequestForm.desiredDueAt}
                    onChange={(event) => onProjectRequestFormChange({ ...projectRequestForm, desiredDueAt: event.target.value })}
                  />
                </label>
              </div>
            </div>
          ) : null}

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
                      className={`${flow.featureCard} ${selected ? flow.featureCardSelected : ""}`}
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
                      className={`${flow.pill} ${selected ? flow.pillSelected : ""}`}
                      onClick={() => {
                        const next = selected
                          ? integrationSelections.filter((entry) => entry !== item)
                          : [...integrationSelections, item];
                        setIntegrationSelections(next);
                        onProjectRequestFormChange({ ...projectRequestForm, integrationsCount: String(next.length || 1) });
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
                          className={`${flow.pill} ${selected ? flow.pillSelected : ""}`}
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
                  <span className={flow.fieldLabel}>Budget Hint (cents)</span>
                  <input
                    className={styles.fieldInput}
                    aria-label="Budget hint"
                    placeholder="e.g. 350000"
                    value={projectRequestForm.estimatedBudgetCents}
                    onChange={(event) => onProjectRequestFormChange({ ...projectRequestForm, estimatedBudgetCents: event.target.value })}
                  />
                </label>
                <label className={flow.field}>
                  <span className={flow.fieldLabel}>Priority</span>
                  <select
                    className={styles.fieldInput}
                    aria-label="Priority"
                    value={projectRequestForm.priority}
                    onChange={(event) =>
                      onProjectRequestFormChange({ ...projectRequestForm, priority: event.target.value as "LOW" | "MEDIUM" | "HIGH" })
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

          {requestStep === 4 ? (
            <div className={flow.stepBody}>
              <div className={flow.stepTitle}>Important disclosure</div>
              <div className={flow.stepSub}>Read and acknowledge client-paid external costs before submission.</div>

              <div className={flow.disclosure}>
                <div className={flow.disclosureTitle}>Client Responsibilities & Exclusions</div>
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
                    onChange={(event) => onProjectRequestFormChange({ ...projectRequestForm, requiresDomainAndHosting: event.target.checked })}
                  />
                  <span>I acknowledge these costs are client-paid and not included in the quote.</span>
                </label>
              </div>
            </div>
          ) : null}

          {requestStep === 5 ? (
            <div className={flow.stepBody}>
              <div className={flow.stepTitle}>Sign and upload agreement</div>
              <div className={flow.stepSub}>Agreement upload is required before previewing quote and deposit.</div>

              <div className={flow.actionsRow}>
                <button className={cx("button", "buttonGhost")} type="button" onClick={onDownloadAgreementTemplate}>
                  Download Agreement
                </button>
                <label htmlFor={fileInputId} className={cx("button", "buttonGhost")}>Upload Signed File</label>
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
                  onChange={(event) => onProjectRequestFormChange({ ...projectRequestForm, agreementFileId: event.target.value })}
                >
                  <option value="">Select signed agreement file</option>
                  {files.map((file) => (
                    <option key={file.id} value={file.id}>{file.fileName}</option>
                  ))}
                </select>
              </label>

              {uploadState !== "idle" ? (
                <div className={flow.uploadMsg}>{uploadState === "uploading" ? "Uploading file..." : uploadMessage ?? "Upload complete"}</div>
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

          {!stepIsValid && stepWarnings.length > 0 ? (
            <div className={flow.warnBox} role="alert" aria-live="polite">
              {stepWarnings.map((warning) => (
                <div key={warning}>• {warning}</div>
              ))}
            </div>
          ) : null}
        </div>

        <div className={flow.footer}>
          <div>
            <div className={flow.footerLabel}>Live Estimate</div>
            <div className={flow.footerValue}>{budgetHintLabel}</div>
          </div>
          <div className={flow.footerActions}>
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
                Next
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
    </section>
  );
}
