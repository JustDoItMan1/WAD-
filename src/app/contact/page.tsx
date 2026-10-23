import type { Metadata } from 'next';
import { ContactForm } from '@/components/features/contact/ContactForm';
import { getSessionUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact the Tuck In tuckshop about an order, bulk orders for events, or anything else.',
};

const ContactPage = async () => {
  const user = await getSessionUser();
  return (
    <main id="main">
      <header className="container page-header">
        <h1>Contact</h1>
        <p>For an order you placed today, it is quickest to come to the counter or call.</p>
      </header>

      <div className="container split split--wide-left">
        <section aria-labelledby="form-title">
          <h2 id="form-title">Send a message</h2>
          <ContactForm name={user?.name ?? ''} email={user?.email ?? ''} />
        </section>

        <aside className="stack" aria-label="Where to find us">
          <section className="panel">
            <h2>Find us</h2>
            <address>
              Block C, ground floor, next to the library<br />
              Main Campus, Windhoek<br /><br />
              Phone: <a href="tel:+264811234567">081 123 4567</a><br />
              Email: <a href="mailto:hello@tuckin.com">hello@tuckin.com</a>
            </address>
          </section>
          <iframe title="Map of the campus in Windhoek" className="map" loading="lazy"
            src="https://www.openstreetmap.org/export/embed.html?bbox=17.06%2C-22.58%2C17.10%2C-22.55&amp;layer=mapnik" />
        </aside>
      </div>
    </main>
  );
};

export default ContactPage;
