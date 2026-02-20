type Labels = Record<string, string | number | boolean | undefined>;

interface CounterMetric {
  type: "counter";
  help: string;
  values: Map<string, number>;
}

interface GaugeMetric {
  type: "gauge";
  help: string;
  values: Map<string, number>;
}

interface HistogramMetric {
  type: "histogram";
  help: string;
  buckets: number[];
  values: Map<string, number[]>;
  sums: Map<string, number>;
  counts: Map<string, number>;
}

type Metric = CounterMetric | GaugeMetric | HistogramMetric;

function normalizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_:]/g, "_");
}

function labelsKey(labels: Labels = {}): string {
  const pairs = Object.entries(labels)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`);
  return pairs.join(",");
}

function formatLabels(key: string): string {
  if (!key) return "";
  const formatted = key
    .split(",")
    .map((entry) => {
      const [name, value] = entry.split("=");
      return `${name}="${value?.replace(/"/g, '\\"')}"`;
    })
    .join(",");
  return `{${formatted}}`;
}

export class ServiceMetrics {
  private readonly metrics = new Map<string, Metric>();

  registerCounter(name: string, help: string): void {
    const normalized = normalizeName(name);
    if (this.metrics.has(normalized)) return;
    this.metrics.set(normalized, { type: "counter", help, values: new Map() });
  }

  registerHistogram(name: string, help: string, buckets: number[]): void {
    const normalized = normalizeName(name);
    if (this.metrics.has(normalized)) return;
    this.metrics.set(normalized, {
      type: "histogram",
      help,
      buckets: [...buckets].sort((a, b) => a - b),
      values: new Map(),
      sums: new Map(),
      counts: new Map()
    });
  }

  registerGauge(name: string, help: string): void {
    const normalized = normalizeName(name);
    if (this.metrics.has(normalized)) return;
    this.metrics.set(normalized, { type: "gauge", help, values: new Map() });
  }

  inc(name: string, labels: Labels = {}, value = 1): void {
    const metric = this.metrics.get(normalizeName(name));
    if (!metric || (metric.type !== "counter" && metric.type !== "gauge")) return;
    const key = labelsKey(labels);
    const current = metric.values.get(key) ?? 0;
    metric.values.set(key, current + value);
  }

  set(name: string, value: number, labels: Labels = {}): void {
    const metric = this.metrics.get(normalizeName(name));
    if (!metric || metric.type !== "gauge") return;
    metric.values.set(labelsKey(labels), value);
  }

  observe(name: string, value: number, labels: Labels = {}): void {
    const metric = this.metrics.get(normalizeName(name));
    if (!metric || metric.type !== "histogram") return;

    const key = labelsKey(labels);
    const bucketValues = metric.values.get(key) ?? new Array(metric.buckets.length + 1).fill(0);

    metric.buckets.forEach((bucket, index) => {
      if (value <= bucket) {
        bucketValues[index] += 1;
      }
    });

    // +Inf bucket
    bucketValues[bucketValues.length - 1] += 1;

    metric.values.set(key, bucketValues);
    metric.sums.set(key, (metric.sums.get(key) ?? 0) + value);
    metric.counts.set(key, (metric.counts.get(key) ?? 0) + 1);
  }

  renderPrometheus(): string {
    const lines: string[] = [];

    for (const [name, metric] of this.metrics.entries()) {
      lines.push(`# HELP ${name} ${metric.help}`);
      lines.push(`# TYPE ${name} ${metric.type}`);

      if (metric.type === "counter" || metric.type === "gauge") {
        for (const [key, value] of metric.values.entries()) {
          lines.push(`${name}${formatLabels(key)} ${value}`);
        }
        continue;
      }

      for (const [key, bucketValues] of metric.values.entries()) {
        metric.buckets.forEach((bucket, index) => {
          const labels = key ? `${key},le=${bucket}` : `le=${bucket}`;
          lines.push(`${name}_bucket${formatLabels(labels)} ${bucketValues[index]}`);
        });

        const infLabels = key ? `${key},le=+Inf` : "le=+Inf";
        lines.push(`${name}_bucket${formatLabels(infLabels)} ${bucketValues[bucketValues.length - 1]}`);
        lines.push(`${name}_sum${formatLabels(key)} ${metric.sums.get(key) ?? 0}`);
        lines.push(`${name}_count${formatLabels(key)} ${metric.counts.get(key) ?? 0}`);
      }
    }

    return `${lines.join("\n")}\n`;
  }
}
