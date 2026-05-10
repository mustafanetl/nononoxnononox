import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <header className="border-b border-border">
      <nav className="container mx-auto flex items-center gap-3 px-4 py-4">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Link to="/">
          <Logo size="sm" />
        </Link>
      </nav>
    </header>

    <main className="container mx-auto px-4 py-12 max-w-2xl prose prose-sm dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

      <h2>1. Information We Collect</h2>
      <p>When you use Jolliday, we may collect:</p>
      <ul>
        <li><strong>Account information:</strong> email address, display name, and profile picture when you sign up.</li>
        <li><strong>Trip data:</strong> destinations, preferences, and itineraries you create through our chat.</li>
        <li><strong>Usage data:</strong> pages visited, features used, and device/browser information for analytics.</li>
        <li><strong>Payment data:</strong> processed securely by our payment provider — we never store your card details.</li>
      </ul>

      <h2>2. How We Use Your Data</h2>
      <ul>
        <li>To generate and save personalized trip plans.</li>
        <li>To improve our AI recommendations and user experience.</li>
        <li>To process payments and manage subscriptions.</li>
        <li>To send important account-related communications.</li>
      </ul>

      <h2>3. Data Storage & Security</h2>
      <p>Your data is stored securely using industry-standard encryption. We use trusted cloud infrastructure to ensure your information is protected against unauthorized access.</p>

      <h2>4. Data Sharing</h2>
      <p>We do not sell your personal information. We may share data with:</p>
      <ul>
        <li>Service providers who help us operate the platform (hosting, analytics, payments).</li>
        <li>Law enforcement when required by law.</li>
      </ul>

      <h2>5. Cookies</h2>
      <p>We use essential cookies to keep you logged in and functional cookies to remember your preferences (e.g., theme, currency). We do not use third-party advertising cookies.</p>

      <h2>6. Your Rights</h2>
      <p>Depending on your location, you may have the right to:</p>
      <ul>
        <li>Access and download your personal data.</li>
        <li>Request correction or deletion of your data.</li>
        <li>Withdraw consent for data processing.</li>
        <li>Lodge a complaint with a data protection authority.</li>
      </ul>

      <h2>7. Data Retention</h2>
      <p>We retain your data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where retention is required by law.</p>

      <h2>8. Children's Privacy</h2>
      <p>Jolliday is not intended for users under 16. We do not knowingly collect data from children.</p>

      <h2>9. Changes to This Policy</h2>
      <p>We may update this Privacy Policy periodically. We will notify you of significant changes via email or in-app notification.</p>

      <h2>10. Contact</h2>
      <p>For privacy-related inquiries, email us at <a href="mailto:hello@jolliday.app" className="text-primary hover:underline">hello@jolliday.app</a>.</p>
    </main>
  </div>
);

export default Privacy;
