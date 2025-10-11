'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Download,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  Wand2,
} from 'lucide-react';
import { handlePlanUpload, handleGenerateQuote } from '@/lib/actions';
import { generateInvoiceJSON } from '@/lib/calculator';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';

type ActionsCardProps = {
  totals: {
    totalArea: number;
    totalBlocks: number;
    totalBeamLength: number;
    totalConcreteVolume: number;
    brc: { rollsNeeded: number };
  };
  setRooms: (rooms: { name: string; length: number; width: number }[]) => void;
};

function SubmitButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} disabled={pending}>
      {pending && <Loader2 className="mr-2 animate-spin" />}
      {children}
    </Button>
  );
}

export function ActionsCard({ totals, setRooms }: ActionsCardProps) {
  const { toast } = useToast();

  const handleDownloadInvoice = () => {
    const {
      totalBlocks,
      totalBeamLength,
      totalConcreteVolume,
      brc,
      totalArea,
    } = totals;
    const json = generateInvoiceJSON(
      totalBlocks,
      totalBeamLength,
      totalConcreteVolume,
      brc,
      totalArea
    );
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SilaCalc-Invoice-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [uploadState, uploadFormAction] = useFormState(handlePlanUpload, {
    message: '',
  });
  const [quoteState, quoteFormAction] = useFormState(handleGenerateQuote, {
    message: '',
  });
  
  const uploadDialogCloseRef = useRef<HTMLButtonElement>(null);
  const quoteResultDialogCloseRef = useRef<HTMLButtonElement>(null);
  const [isQuoteResultOpen, setQuoteResultOpen] = useState(false);

  useEffect(() => {
    if (uploadState.message) {
      toast({
        title: 'Success',
        description: uploadState.message,
      });
      if (uploadState.data?.roomDimensions) {
        setRooms(uploadState.data.roomDimensions);
      }
      uploadDialogCloseRef.current?.click();
    }
    if (uploadState.error) {
      toast({
        title: 'Upload Error',
        description: uploadState.error,
        variant: 'destructive',
      });
    }
  }, [uploadState, toast, setRooms]);

  useEffect(() => {
    if (quoteState.message) {
      toast({
        title: 'Success',
        description: quoteState.message,
      });
      setQuoteResultOpen(true);
    }
    if (quoteState.error) {
      toast({
        title: 'Quote Error',
        description: quoteState.error,
        variant: 'destructive',
      });
    }
  }, [quoteState, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Project Actions</CardTitle>
        <CardDescription>
          Generate invoices, use AI to analyze plans, or get a quote.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row">
        <Button onClick={handleDownloadInvoice} variant="secondary">
          <Download /> Download Invoice
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Upload /> Upload Plan (AI)
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Analyze Building Plan</DialogTitle>
              <DialogDescription>
                Upload a PDF or image of your building plan. Our AI will analyze
                it and automatically populate the room dimensions.
              </DialogDescription>
            </DialogHeader>
            <form action={uploadFormAction} className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="planFile">Plan File</Label>
                <Input id="planFile" name="planFile" type="file" required accept=".pdf,image/*"/>
              </div>
              <DialogFooter>
                <DialogClose ref={uploadDialogCloseRef} asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <SubmitButton>
                  <Wand2 /> Analyze
                </SubmitButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="accent">
              <FileText /> Generate Quote (AI)
            </Button>
          </DialogTrigger>
          <DialogContent>
             <form action={quoteFormAction}>
                <DialogHeader>
                  <DialogTitle>Generate Monetary Quote</DialogTitle>
                  <DialogDescription>
                    Enter your region to get an AI-generated quote based on the
                    calculated material quantities.
                  </DialogDescription>
                </DialogHeader>
                <div className="my-4">
                  <Label htmlFor="region">Region</Label>
                  <Input id="region" name="region" placeholder="e.g., Nairobi, Kenya" required/>
                  {quoteState?.error && <p className="text-sm text-destructive mt-1">{quoteState.error}</p>}
                </div>
                {/* Hidden inputs to pass totals */}
                <input type="hidden" name="blocks" value={totals.totalBlocks} />
                <input type="hidden" name="beamLength" value={totals.totalBeamLength} />
                <input type="hidden" name="concreteVolume" value={totals.totalConcreteVolume} />
                <input type="hidden" name="brcRolls" value={totals.brc.rollsNeeded} />
                <DialogFooter>
                   <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                   <SubmitButton><Wand2/> Generate</SubmitButton>
                </DialogFooter>
             </form>
          </DialogContent>
        </Dialog>

        {/* Dialog to show quote result */}
        <Dialog open={isQuoteResultOpen} onOpenChange={setQuoteResultOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your Generated Quote</DialogTitle>
              <DialogDescription>
                Here is the estimated quote based on your project details and region.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 rounded-md border bg-muted p-4">
              <Textarea
                  readOnly
                  value={quoteState.data?.quote || 'No quote available.'}
                  className="h-64 font-code text-sm"
              />
            </div>
            <DialogFooter>
              <Button onClick={() => setQuoteResultOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
}
