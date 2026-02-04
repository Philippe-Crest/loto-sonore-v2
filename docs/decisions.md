# Décisions

## 2026-02-04 — Report de la Phase 5.1 (stabilisation préventive)

**Décision** : report / non-application de la Phase 5.1 (stabilisation préventive).

**Motif** :

- Les tests manuels existants n’ont pas mis en évidence de bug bloquant en production actuelle (Phase 5.0).
- Les tentatives de durcissement Phase 5.1 ont provoqué des régressions observées en tests (ex : comportement de pause inattendu lors d’une action de jeu), donc risque immédiat supérieur au gain préventif.
- Arbitrage assumé : accepter un risque résiduel estimé ~5% et n’appliquer des consolidations qu’en réponse à des retours utilisateurs (approche “evidence-based”).

**Conséquence** :

- Aucun correctif préventif Phase 5.1 n’est intégré.
- Toute future stabilisation devra être déclenchée par une remontée terrain et traitée par correctifs atomiques + tests.
