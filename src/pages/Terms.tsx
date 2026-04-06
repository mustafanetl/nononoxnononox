import { Link } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <header className="border-b border-border">
      <nav className="container mx-auto flex items-center gap-3 px-4 py-4">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
            <Compass className="h-3.5 w-3.5 text-background" />
          </div>
          <span className="font-semibold">Jolliday</span>
        </div>
      </nav>
    </header>

    <main className="container mx-auto px-4 py-12 max-w-2xl prose prose-sm dark:prose-invert">
      <h1>Terms of Use</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

      <h2>1. Acceptance of Terms</h2>
      <p>By accessing or using Jolliday ("the Service"), you agree to be bound by these Terms of Use. If you do not agree, please do not use the Service.</p>

      <h2>2. Description of Service</h2>
      <p>Jolliday is an AI-powered travel planning platform that generates personalized trip itineraries, including flight and hotel recommendations, activity suggestions, and day-by-day plans. We provide information and recommendations — we do not directly sell or book travel services.</p>

      <h2>3. User Accounts</h2>
      <p>To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</p>

      <h2>4. Subscriptions & Billing</h2>
      <p>Premium features require a paid subscription. By subscribing, you authorize us to charge your payment method on a recurring basis. You may cancel at any time; access continues until the end of your billing period. Free trials, if offered, convert to paid subscriptions unless cancelled before the trial ends.</p>

      <h2>5. User Conduct</h2>
      <p>You agree not to misuse the Service, including but not limited to: attempting to access unauthorized areas, interfering with the Service's operation, or using the Service for any unlawful purpose.</p>

      <h2>6. Intellectual Property</h2>
      <p>All content, design, and technology of Jolliday are owned by us or our licensors. You may not copy, modify, or distribute any part of the Service without prior written consent.</p>

      <h2>7. Third-Party Services</h2>
      <p>Jolliday may link to third-party booking platforms (e.g., Booking.com, Skyscanner). We are not responsible for the content, policies, or practices of these external sites. Your interactions with them are governed by their own terms.</p>

      <h2>8. Disclaimer of Warranties</h2>
      <p>The Service is provided "as is" without warranties of any kind. We do not guarantee the accuracy of travel information, pricing, or availability. Always verify details with the booking provider.</p>

      <h2>9. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, Jolliday shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>

      <h2>10. Changes to Terms</h2>
      <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>

      <h2>11. Contact</h2>
      <p>Questions about these Terms? Contact us at <a href="mailto:hello@jolliday.app" className="text-primary hover:underline">hello@jolliday.app</a>.</p>
    </main>
  </div>
);

export default Terms;
