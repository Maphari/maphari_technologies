"use client";

import { cx } from "../style";

const vendors = [
  { name: "Unsplash Premium", category: "Stock Media", contact: "billing@unsplash.com", status: "Active", monthlyCost: 850, contract: "Annual", renewsAt: "Dec 2026" },
  { name: "Adobe Creative Cloud", category: "Software", contact: "enterprise@adobe.com", status: "Active", monthlyCost: 12500, contract: "Annual", renewsAt: "Jun 2026" },
  { name: "Lottie Files Pro", category: "Animation", contact: "support@lottiefiles.com", status: "Active", monthlyCost: 420, contract: "Monthly", renewsAt: "—" },
  { name: "Printify SA", category: "Print", contact: "orders@printify.co.za", status: "Active", monthlyCost: 0, contract: "Per job", renewsAt: "—" },
  { name: "AWS (Cape Town)", category: "Hosting", contact: "aws-support@maphari.com", status: "Active", monthlyCost: 8200, contract: "On-demand", renewsAt: "—" },
  { name: "Figma Enterprise", category: "Software", contact: "sales@figma.com", status: "Active", monthlyCost: 4800, contract: "Annual", renewsAt: "Mar 2027" },
  { name: "Slack Business+", category: "Communication", contact: "billing@slack.com", status: "Active", monthlyCost: 2200, contract: "Annual", renewsAt: "Sep 2026" },
  { name: "Vercel Pro", category: "Hosting", contact: "billing@vercel.com", status: "Under Review", monthlyCost: 1600, contract: "Annual", renewsAt: "Apr 2026" },
];

function statusTone(status: string) {
  if (status === "Active") return "badgeGreen";
  if (status === "Under Review") return "badgeAmber";
  return "badge";
}

export function VendorDirectoryPage({ isActive }: { isActive: boolean }) {
  const totalMonthlyCost = vendors.filter((v) => v.status === "Active").reduce((s, v) => s + v.monthlyCost, 0);

  return (
    <section className={cx("page", "pageBody", isActive && "pageActive")} id="page-vendor-directory">
      <div className={cx("pageHeaderBar")}>
        <div className={cx("pageEyebrowText", "mb8")}>Staff Dashboard / Client Finance</div>
        <h1 className={cx("pageTitleText")}>Vendor Directory</h1>
        <p className={cx("pageSubtitleText", "mb20")}>Approved vendor list and tool subscriptions (read-only)</p>
      </div>

      <div className={cx("stats", "stats3", "mb28")}>
        {[
          { label: "Active Vendors", value: String(vendors.filter((v) => v.status === "Active").length), tone: "colorGreen" },
          { label: "Monthly Spend", value: `R${totalMonthlyCost.toLocaleString()}`, tone: "colorAccent" },
          { label: "Under Review", value: String(vendors.filter((v) => v.status === "Under Review").length), tone: "colorAmber" },
        ].map((stat) => (
          <div key={stat.label} className={cx("card")}>
            <div className={cx("text10", "colorMuted2", "uppercase", "tracking", "mb6")}>{stat.label}</div>
            <div className={cx("fontDisplay", "fw800", "text20", stat.tone)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className={cx("card")}>
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Category</th>
                <th>Contact</th>
                <th>Contract</th>
                <th>Monthly Cost</th>
                <th>Renews</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.name}>
                  <td className={cx("fw600")}>{vendor.name}</td>
                  <td><span className={cx("badge")}>{vendor.category}</span></td>
                  <td className={cx("fontMono", "text12", "colorMuted")}>{vendor.contact}</td>
                  <td className={cx("text12")}>{vendor.contract}</td>
                  <td className={cx("fontMono", "fw600")}>{vendor.monthlyCost > 0 ? `R${vendor.monthlyCost.toLocaleString()}` : "Variable"}</td>
                  <td className={cx("text12", "colorMuted")}>{vendor.renewsAt}</td>
                  <td><span className={cx("badge", statusTone(vendor.status))}>{vendor.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
