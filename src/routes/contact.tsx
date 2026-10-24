import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — LocalSeva" },
      { name: "description", content: "Get in touch with the LocalSeva team for inquiries, support, or feedback." },
      { property: "og:title", content: "Contact Us — LocalSeva" },
      { property: "og:description", content: "Reach out to the LocalSeva team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      toast.success("Message sent! Our support team will get back to you shortly.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    }, 600);
  };

  return (
    <div className="container-page max-w-5xl py-12">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Get In Touch</h1>
        <p className="mt-2 text-muted-foreground">Have questions, feedback, or need help? We're here for you.</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="card-surface p-6">
            <h3 className="text-lg font-bold">Contact Details</h3>
            <p className="mt-1 text-sm text-muted-foreground">Feel free to reach out via email or visit our community support offices.</p>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-teal-soft p-2.5 text-teal shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Email Support</p>
                  <p className="text-sm text-muted-foreground">support@localseva.in</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-teal-soft p-2.5 text-teal shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Helpline</p>
                  <p className="text-sm text-muted-foreground">+91 22 2345 6789 (Mon-Sat, 9AM - 6PM)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-teal-soft p-2.5 text-teal shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Location</p>
                  <p className="text-sm text-muted-foreground">Andheri East, Mumbai, Maharashtra 400069</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-surface p-6">
            <h4 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-teal" /> College Project Demonstration
            </h4>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              LocalSeva is an academic project prototype designed to demonstrate a scalable, full-stack hyperlocal marketplace with Supabase authentication and PostgreSQL database storage.
            </p>
          </div>
        </div>

        {/* Message Form */}
        <form onSubmit={handleSubmit} className="card-surface space-y-4 p-6 sm:p-8">
          <h3 className="text-xl font-bold">Send us a message</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-name">Your Name *</Label>
              <Input id="c-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Rohan Sharma" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">Your Email *</Label>
              <Input id="c-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rohan@example.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-sub">Subject</Label>
            <Input id="c-sub" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Inquiry about worker registration" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-msg">Message *</Label>
            <Textarea id="c-msg" required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message here..." />
          </div>
          <Button type="submit" variant="teal" className="w-full sm:w-auto" disabled={busy}>
            <Send className="mr-2 h-4 w-4" /> {busy ? "Sending…" : "Send Message"}
          </Button>
        </form>
      </div>
    </div>
  );
}
