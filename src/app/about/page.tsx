import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'The Tuck In tuckshop in Block C: who runs it, when it is open and how ordering works.',
};

const FAQ = [
  ['Do I need an account to order?', 'You can look at the menu and add items without one. You need an account to send the order, so we can show you when it is ready.'],
  ['How do I pay?', 'Cash or card at the counter when you collect. Nothing is charged online.'],
  ['Can I cancel an order?', 'Yes, from My orders, as long as the kitchen has not started it. After that, speak to us at the counter.'],
  ["What happens if I don't collect?", 'We keep orders until closing time. Orders that are not collected too often may be refused.'],
];

const TIMELINE = [
  ['2019', 'Opened with a grill, a fridge and eight items on the board.'],
  ['2021', 'Added boerewors rolls and a second fryer for slap chips.'],
  ['2023', 'Started taking card payments at the counter.'],
  ['2026', 'Started taking orders online.'],
];

const AboutPage = () => (
  <main id="main">
    <header className="container page-header">
      <h1>About Tuck In</h1>
      <p>The tuckshop on the ground floor of Block C, next to the library.</p>
    </header>

    <div className="container split split--wide-left">
      <article>
        <h2>Why we take orders online</h2>
        <p>
          At lunch the queue for russian rolls used to reach the stairs, and most people only have
          a short break between lectures. Ordering ahead means the kitchen can start your food before you arrive,
          so you collect it and go.
        </p>
        <p>
          The counter still works the old way too: walk up, order, pay. Online orders are simply packed first
          at the time you choose.
        </p>

        <h2>How the shop has grown</h2>
        <ol className="timeline" role="list">
          {TIMELINE.map(([year, text]) => (
            <li key={year}><time dateTime={year}>{year}</time><p>{text}</p></li>
          ))}
        </ol>
      </article>

      <aside className="stack" aria-label="Opening hours and staff">
        <section className="panel" aria-labelledby="hours-title">
          <h2 id="hours-title">Opening hours</h2>
          <table className="hours">
            <caption className="visually-hidden">Weekly opening hours</caption>
            <tbody>
              <tr><th scope="row">Monday to Thursday</th><td><time>07:30</time> to <time>15:30</time></td></tr>
              <tr><th scope="row">Friday</th><td><time>07:30</time> to <time>14:00</time></td></tr>
              <tr><th scope="row">Weekends and public holidays</th><td>Closed</td></tr>
            </tbody>
          </table>
        </section>
        <section className="panel" aria-labelledby="team-title">
          <h2 id="team-title">Behind the counter</h2>
          <dl className="team">
            <div><dt>Maria Shikongo</dt><dd>Runs the shop and the grill</dd></div>
            <div><dt>Thomas Nghipondoka</dt><dd>Kitchen, rolls and chips</dd></div>
            <div><dt>Selma Iipinge</dt><dd>Counter, stock and online orders</dd></div>
          </dl>
        </section>
      </aside>
    </div>

    <section className="container section faq" aria-labelledby="faq-title">
      <h2 id="faq-title">Questions</h2>
      {/* Sharing a name makes the browser close the other answers when one opens */}
      {FAQ.map(([question, answer]) => (
        <details key={question} name="faq">
          <summary>{question}</summary>
          <p>{answer}</p>
        </details>
      ))}
    </section>
  </main>
);

export default AboutPage;
