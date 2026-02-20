interface MainLogoProps {
  suffix?: string;
}

export function MainLogo({ suffix }: MainLogoProps) {
  return (
    <>
      Maph<span>a</span>ri
      {suffix ? <> {suffix}</> : null}
    </>
  );
}
