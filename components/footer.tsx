export function Footer() {
    return (
        <footer className="bg-muted p-7">
            <p className="text-foreground text-xs font-semibold">
                &copy; {new Date().getFullYear()} Aparatus
            </p>
            <p className="text-muted-foreground text-xs">
                Todos os direitos reservados.
            </p>
        </footer>
    )
}

