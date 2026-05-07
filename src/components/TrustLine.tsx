const TrustLine = ({ className = "" }: { className?: string }) => (
  <p
    className={`text-center text-muted-foreground mt-2 ${className}`}
    style={{ fontSize: "12px" }}
  >
    3-day free trial · Cancel anytime
  </p>
);

export default TrustLine;