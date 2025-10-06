import { getCreditNotes } from "@/lib/actions/credit-note";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle } from "lucide-react";

export default async function CreditNotesPage() {
  const creditNotes = await getCreditNotes();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'fully_used':
      case 'refunded':
        return 'default';
      case 'available':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Credit Notes</h1>
        <p className="text-muted-foreground">
          Manage customer credit notes and refunds
        </p>
      </div>

      {creditNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Credit Notes</h3>
            <p className="text-muted-foreground text-center">
              Credit notes will appear here when customers return items or receive refunds.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {creditNotes.map((creditNote) => (
            <Link 
              key={creditNote.id} 
              href={`/dashboard/credit-notes/${creditNote.id}`}
              className="block hover:bg-muted/50 rounded-lg transition-colors"
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold text-lg">
                          Credit Note {creditNote.creditNoteNumber || creditNote.id}
                        </span>
                        <Badge variant={getStatusVariant(creditNote.status)} className="capitalize">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {creditNote.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{creditNote.customerName}</span>
                        <span className="mx-2">•</span>
                        <span>Issued: {creditNote.issueDate}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {creditNote.items.length} item{creditNote.items.length !== 1 ? 's' : ''} returned
                        {creditNote.remainingCredit > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="text-amber-600">
                              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(creditNote.remainingCredit)} remaining
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-destructive">
                        -{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(creditNote.totalCredit)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Credit
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}