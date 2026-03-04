import Nav from '@/components/marketing/Nav';
import Hero from '@/components/marketing/Hero';
import Products from '@/components/marketing/Products';
import Clients from '@/components/marketing/Clients';
import Intelligence from '@/components/marketing/Intelligence';
import Footer from '@/components/marketing/Footer';

export default function HomePage() {
  return (
    <main>
      <Nav />
      <Hero />
      <Products />
      <Clients />
      <Intelligence />
      <Footer />
    </main>
  );
}
