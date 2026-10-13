import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-6">
    <div className="text-center">
      <h1 className="mb-2 font-display text-6xl text-primary">404</h1>
      <p className="mb-6 text-lg text-muted-foreground">Página não encontrada</p>
      <Link to="/" className="inline-flex rounded-md bg-primary px-5 py-2 font-semibold text-primary-foreground">
        Voltar ao início
      </Link>
    </div>
  </div>
);

export default NotFound;
