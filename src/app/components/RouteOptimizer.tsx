import { useMemo, useState } from "react";
import { ArrowRightLeft, Clock, MapPin, Train, Wallet } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { LINE_COLORS, getUniqueStations } from "@/data/stations";
import { findBestRoutes, type RoutePlan } from "@/lib/routePlanner";

function RouteSummary({ plan, title }: { plan: RoutePlan; title: string }) {
  return (
    <Card className="border-border/70">
      <CardHeader className="gap-2 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <Wallet className="size-3" />
              {plan.totalFare} THB
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="size-3" />~{plan.totalMinutes} min
            </Badge>
            <Badge variant="outline" className="gap-1">
              <ArrowRightLeft className="size-3" />
              {plan.transfers} transfer{plan.transfers === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {plan.segments.map((segment, index) => (
          <div key={`${segment.line}-${index}`} className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={LINE_COLORS[segment.line]}>{segment.label}</Badge>
              <span className="text-sm text-muted-foreground">
                {segment.stops} stop{segment.stops === 1 ? "" : "s"} ·{" "}
                {segment.fare} THB
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              {segment.stations.map((station) => station.name).join(" → ")}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RouteOptimizer() {
  const stations = useMemo(() => getUniqueStations(), []);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [result, setResult] = useState<{
    best: RoutePlan | null;
    alternatives: RoutePlan[];
  } | null>(null);

  const handleSearch = () => {
    setResult(findBestRoutes(from, to));
  };

  const canSearch = from.length > 0 && to.length > 0 && from !== to;

  return (
    <div className="min-h-full bg-gradient-to-b from-[#f7f9fc] to-white px-4 py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Train className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Real-time Train Route Optimizer
          </h1>
          <p className="text-sm text-muted-foreground">
            Find the cheapest BTS and MRT routes across Bangkok with estimated
            fares and transfer guidance.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plan your trip</CardTitle>
            <CardDescription>
              Select a start and destination station to compare cost-optimized
              routes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="size-4 text-muted-foreground" />
                  From
                </label>
                <Select value={from} onValueChange={setFrom}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.name} value={station.name}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="size-4 text-muted-foreground" />
                  To
                </label>
                <Select value={to} onValueChange={setTo}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.name} value={station.name}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full" disabled={!canSearch} onClick={handleSearch}>
              Find cheapest route
            </Button>
          </CardContent>
        </Card>

        {result && !result.best && (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No route found between those stations. Try another combination.
            </CardContent>
          </Card>
        )}

        {result?.best && (
          <div className="space-y-4">
            <RouteSummary plan={result.best} title="Best value route" />
            {result.alternatives.map((plan, index) => (
              <RouteSummary
                key={plan.path.map((station) => station.id).join("-")}
                plan={plan}
                title={`Alternative ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
