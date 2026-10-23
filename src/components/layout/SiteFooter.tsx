export const SiteFooter = () => (
  <footer className="site-footer">
    <div className="container">
      <div className="footer-grid">
        <section aria-labelledby="footer-about">
          <h2 id="footer-about">Tuck In</h2>
          <p>The tuckshop in Block C. Order from class, pay at the counter, collect when your number is called.</p>
        </section>
        <section aria-labelledby="footer-hours">
          <h2 id="footer-hours">Open</h2>
          <p>Mon to Thu, 07:30 to 15:30<br />Fri, 07:30 to 14:00</p>
        </section>
        <section aria-labelledby="footer-visit">
          <h2 id="footer-visit">Find us</h2>
          <address>
            Block C, ground floor<br />
            Main Campus, Windhoek<br />
            <a href="tel:+264811234567">081 123 4567</a>
          </address>
        </section>
      </div>
      <p className="footer-bottom">&copy; {new Date().getFullYear()} Tuck In Tuckshop</p>
    </div>
  </footer>
);
