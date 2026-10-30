---
title: 5 razloga zašto vas AI asistenti ne preporučuju
slug: zasto-vas-ai-asistenti-ne-preporucuju
date: 2026-10-30
description: Pet čestih razloga zbog kojih ChatGPT, Gemini i Perplexity ne spominju vašu firmu i što možete sami popraviti već ovaj tjedan.
author: Tehneo
category: Savjeti
ai_assisted: true
draft: false
---
Kad netko pita ChatGPT tko u njegovu gradu radi ono što radite vi, asistent ne pretražuje internet kao čovjek. Skuplja ono što je pročitao, spaja izvore i bira nekoliko imena u koja je dovoljno siguran. Ako vaša firma nije među njima, razlog je najčešće prilično prizeman. Evo pet koje najčešće vrijedi provjeriti.

## 1. Iz vašeg weba nije jasno što radite

Rečenice poput „pružamo kvalitetna rješenja po mjeri” ne govore ništa ni čovjeku ni računalu. Asistent ne može preporučiti firmu za uslugu koju na njezinu webu nije pronašao jasno napisanu.

**Što napraviti:** na početnu stranicu stavite jednu rečenicu koja kaže tko ste, što točno radite, za koga i gdje. Na primjer: „Stolarska radionica iz Osijeka, izrađujemo kuhinje i ugradbene ormare po mjeri za kućanstva u Slavoniji.” Svaka važna usluga neka ima svoju stranicu s vlastitim naslovom.

## 2. Nemate strukturirane podatke

Strukturirani podaci (schema.org, najčešće u obliku JSON-LD) dio su koda stranice koji strojevima izravno kaže kako se firma zove, gdje je, kako je kontaktirati i što nudi. Posjetitelj ih ne vidi, a pretraživačima olakšavaju razumijevanje sadržaja.

**Što napraviti:** dodajte oznake `Organization` ili `LocalBusiness` s nazivom, adresom, telefonom i radnim vremenom, a za usluge oznaku `Service`. Većina sustava za izradu weba ima dodatak za to. Rezultat provjerite Googleovim alatom Rich Results Test.

## 3. Sadržaj se prikazuje samo kroz JavaScript

Mnoge moderne stranice šalju pregledniku gotovo praznu stranicu, a tekst se pojavi tek kad se izvrši JavaScript. Google takve stranice uglavnom zna prikazati, ali mnogi AI crawleri ne izvršavaju JavaScript. Za njih vaš tekst jednostavno ne postoji.

**Što napraviti:** u pregledniku otvorite prikaz izvornog koda (Ctrl+U) i potražite rečenicu s početne stranice. Ako je nema, sadržaj se generira naknadno. Tada zamolite izrađivača weba da ključne stranice prikazuje na poslužitelju ili kao statičan HTML. Usput provjerite da datoteka `robots.txt` ne blokira crawlere poput GPTBota, ClaudeBota i PerplexityBota, osim ako ste to namjerno odlučili.

## 4. Podaci o vama se razlikuju od izvora do izvora

Ako je na webu jedna adresa, na Google Business profilu druga, a u nekom imeniku stari telefon, asistent ne može biti siguran koji je podatak točan. Nesigurnost ne ide vama u prilog.

**Što napraviti:** zapišite točan naziv, adresu, telefon i web na jedno mjesto. Zatim prođite svoj Google Business profil, Facebook, poslovne imenike i stranice udruženja te svugdje uskladite podatke. Posao je dosadan, ali se radi jednom i dugo traje.

## 5. Nitko drugi ne govori o vama

Asistenti se ne oslanjaju samo na ono što firma kaže o sebi. Važno im je i što drugi pišu: recenzije, članci u lokalnim medijima, spominjanja na stranicama partnera i strukovnih udruženja.

**Što napraviti:** zamolite zadovoljne kupce za recenziju, i to konkretnu, u kojoj se vidi koju ste uslugu napravili. Javite se lokalnom portalu kad imate stvarnu vijest. Tražite da vas partneri navedu na svojim stranicama. Ne kupujte lažne recenzije, jer dugoročno štete više nego što pomažu.

## Odakle početi

Prvi korak ne stoji ništa: otvorite ChatGPT, Gemini i Perplexity i postavite im pitanja koja bi postavio vaš kupac. Zapišite spominju li vas, kako vas opisuju i koga preporučuju umjesto vas. Zatim krenite od točke 1 jer je najbrža.

Ako želite da to pogledamo umjesto vas, [zatražite besplatnu provjeru vidljivosti](/kontakt/).
