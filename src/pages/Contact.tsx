import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PageTransition from '@/components/PageTransition';

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="fixed top-4 left-4 z-50">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
        </div>

        <div className="w-full max-w-md">
          <h1 className="font-heading text-foreground text-3xl md:text-4xl tracking-wider mb-8 text-center">
            Contact
          </h1>

          {submitted ? (
            <p className="text-muted-foreground text-center font-body text-sm">
              Message sent. We'll be in touch.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Name"
                required
                className="bg-card border-border text-foreground placeholder:text-muted-foreground font-body"
              />
              <Input
                type="email"
                placeholder="Email"
                required
                className="bg-card border-border text-foreground placeholder:text-muted-foreground font-body"
              />
              <Textarea
                placeholder="Message"
                required
                rows={5}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground font-body resize-none"
              />
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-heading tracking-widest">
                Send
              </Button>
            </form>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Contact;
