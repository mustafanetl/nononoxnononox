import { Link } from "react-router-dom";
import { Heart, Users, Mountain, Utensils, Sparkles, Plane } from "lucide-react";

type Template = {
  title: string;
  description: string;
  query: string;
  icon: React.ElementType;
  gradient: string;
};

const templates: Template[] = [
  {
    title: "Weekend in Paris",
    description: "3 days of romance, art, and croissants",
    query: "Plan a romantic 3-day weekend in Paris for a couple, mid-range budget",
    icon: Heart,
    gradient: "from-rose-500/10 to-pink-500/10",
  },
  {
    title: "Family in Barcelona",
    description: "5 days of beaches, Gaudí, and tapas with kids",
    query: "Plan a 5-day family trip to Barcelona with kids, mix of beaches and culture",
    icon: Users,
    gradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    title: "Adventure in Iceland",
    description: "7 days of waterfalls, glaciers, and northern lights",
    query: "Plan a 7-day adventure trip to Iceland, hiking and nature focus",
    icon: Mountain,
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
  {
    title: "Foodie Tokyo",
    description: "5 days of ramen, sushi, and izakayas",
    query: "Plan a 5-day foodie trip to Tokyo, focus on authentic local food",
    icon: Utensils,
    gradient: "from-amber-500/10 to-orange-500/10",
  },
  {
    title: "Honeymoon in Bali",
    description: "10 days of luxury, temples, and sunsets",
    query: "Plan a 10-day honeymoon in Bali, luxury budget, romantic experiences",
    icon: Sparkles,
    gradient: "from-purple-500/10 to-violet-500/10",
  },
  {
    title: "City Hop: Europe",
    description: "14 days across Amsterdam, Berlin, and Prague",
    query: "Plan a 14-day Europe trip: Amsterdam, Berlin, and Prague, budget-friendly",
    icon: Plane,
    gradient: "from-indigo-500/10 to-blue-500/10",
  },
];

const TripTemplates = () => {
  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 sm:px-6 py-20 md:py-28 max-w-6xl">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs sm:text-sm font-semibold text-primary tracking-[0.15em] uppercase mb-3">
            Trip Templates
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Start with a template
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Pick a starting point and customize from there. Or describe your own trip from scratch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {templates.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.title}
                to={`/chat?q=${encodeURIComponent(t.query)}`}
                className="group p-5 sm:p-6 rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.gradient} border border-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
                  {t.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TripTemplates;
