export default function Navbar() {
    return (
      <nav className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold">MerchStore</h1>
        <div className="flex gap-6">
          <a href="/">Home</a>
          <a href="/products">Products</a>
          <a href="/contact">Contact</a>
          <a href="/login">Login/User</a>
          

        </div>
        
      </nav>
    );
  }