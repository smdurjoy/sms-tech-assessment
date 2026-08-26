import { classify } from "@/lib/domain/classification";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClassificationBadge } from "@/components/assessments/assessment-badges";

export type PortalResultRow = {
  id: string;
  title: string;
  module: string;
  grade: number;
};

export function PortalResults({ results }: { results: PortalResultRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Results</CardTitle>
        <CardDescription>
          Your marksheet shows a result once the Registry publishes it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No results have been published yet.
          </p>
        ) : (
          <div className="rounded-xl ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead className="text-right">Grade</TableHead>
                  <TableHead className="text-right">Classification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.title}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {r.module}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.grade}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex justify-end">
                        <ClassificationBadge classification={classify(r.grade)} />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
