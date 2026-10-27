# Arhiva

Stara naslovnica (`index.html`) privremeno zamijenjena novom interaktivnom stranicom.
Ova mapa je u `.vercelignore`, pa nije javno dostupna.

Vraćanje stare naslovnice:

    git mv -f _arhiva/index.html index.html
    git rm -r css js assets/favicon.svg
    git commit -m "Vrati staru naslovnicu"

Isto stanje je spremljeno i kao git tag `stara-naslovnica`.
Na Vercelu se može i odmah vratiti: Deployments → zadnji deploy prije zamjene → Instant Rollback.
