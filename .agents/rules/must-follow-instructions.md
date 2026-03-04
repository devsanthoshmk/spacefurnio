---
trigger: always_on
---

- always use pnpm
- if you find anything that is hard update its documentation and update the workflow, rules of this workspace for you to make it easy for next time
- strictly document everything you do
- update docs/ folder for every query you solve
- do not assume things my frontend uses different scrolling so dont touch it
- refer backend and db docs at backend/ecommerce-backend/docs
- Do not execute unilateral architectural changes. **without my approval**
- for adding rules and workflows dont go too specific like if you found out that you made a mistake of merging the two database without asking me which is a architechtural change. you need not to update rules about the db merge and all to prevent agents from doiing those kind of mistake add something like """Do not execute unilateral architectural changes. **without approval** """