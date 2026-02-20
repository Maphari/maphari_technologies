import styles from "../../../app/style/maphari-staff-dashboard.module.css";

const cx = (...names: Array<string | false | null | undefined>) =>
  names.filter(Boolean).map((name) => styles[name as keyof typeof styles] ?? name).join(" ");

export { styles, cx };
