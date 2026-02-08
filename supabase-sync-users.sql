-- ============================================================================
-- SCRIPT DE SYNCHRONISATION DES UTILISATEURS
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- ÉTAPE 1: Créer ou mettre à jour la table public.users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    
    -- Métadonnées utilisateur
    first_name TEXT,
    last_name TEXT,
    shop_name TEXT,
    shop_adresse TEXT,
    profile TEXT DEFAULT 'personal',
    bio TEXT,
    
    -- Réseaux sociaux
    social_facebook TEXT,
    social_x TEXT,
    social_linkedin TEXT,
    social_instagram TEXT,
    
    -- Statut du compte
    banned_until TIMESTAMPTZ,
    
    -- Métadonnées brutes (backup)
    raw_user_meta_data JSONB
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_profile ON public.users(profile);

-- Activer RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Politique: Les admins et coopératives peuvent voir tous les profils
-- Utilise auth.users pour éviter la récursion infinie
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'profile' = 'admin'
                 OR auth.users.raw_user_meta_data->>'profile' = 'cooperative')
        )
    );

-- Politique: Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Politique: Les admins peuvent tout modifier
-- Utilise auth.users pour éviter la récursion infinie
CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'profile' = 'admin'
                 OR auth.users.raw_user_meta_data->>'profile' = 'cooperative')
        )
    );


-- ============================================================================
-- ÉTAPE 1.5: Ajouter les colonnes manquantes si la table existe déjà
-- ============================================================================
DO $$ 
BEGIN
    -- Ajouter bio si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'bio'
    ) THEN
        ALTER TABLE public.users ADD COLUMN bio TEXT;
        RAISE NOTICE 'Colonne bio ajoutée';
    END IF;

    -- Ajouter social_facebook si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'social_facebook'
    ) THEN
        ALTER TABLE public.users ADD COLUMN social_facebook TEXT;
        RAISE NOTICE 'Colonne social_facebook ajoutée';
    END IF;

    -- Ajouter social_x si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'social_x'
    ) THEN
        ALTER TABLE public.users ADD COLUMN social_x TEXT;
        RAISE NOTICE 'Colonne social_x ajoutée';
    END IF;

    -- Ajouter social_linkedin si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'social_linkedin'
    ) THEN
        ALTER TABLE public.users ADD COLUMN social_linkedin TEXT;
        RAISE NOTICE 'Colonne social_linkedin ajoutée';
    END IF;

    -- Ajouter social_instagram si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'social_instagram'
    ) THEN
        ALTER TABLE public.users ADD COLUMN social_instagram TEXT;
        RAISE NOTICE 'Colonne social_instagram ajoutée';
    END IF;

    -- Ajouter raw_user_meta_data si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'raw_user_meta_data'
    ) THEN
        ALTER TABLE public.users ADD COLUMN raw_user_meta_data JSONB;
        RAISE NOTICE 'Colonne raw_user_meta_data ajoutée';
    END IF;

    -- Ajouter updated_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Colonne updated_at ajoutée';
    END IF;

    -- Ajouter confirmed_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'confirmed_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN confirmed_at TIMESTAMPTZ;
        RAISE NOTICE 'Colonne confirmed_at ajoutée';
    END IF;

    -- Ajouter last_sign_in_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'last_sign_in_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN last_sign_in_at TIMESTAMPTZ;
        RAISE NOTICE 'Colonne last_sign_in_at ajoutée';
    END IF;

    -- Ajouter banned_until si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'banned_until'
    ) THEN
        ALTER TABLE public.users ADD COLUMN banned_until TIMESTAMPTZ;
        RAISE NOTICE 'Colonne banned_until ajoutée';
    END IF;

    RAISE NOTICE 'Vérification des colonnes terminée';
END $$;


-- ============================================================================
-- ÉTAPE 2: Fonction pour synchroniser un utilisateur
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_user_to_public(user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.users (
        id, email, phone, created_at, confirmed_at, last_sign_in_at,
        first_name, last_name, shop_name, shop_adresse, profile, bio,
        social_facebook, social_x, social_linkedin, social_instagram,
        banned_until, raw_user_meta_data, updated_at
    )
    SELECT 
        au.id, au.email, au.phone, au.created_at, au.confirmed_at, au.last_sign_in_at,
        au.raw_user_meta_data->>'first_name',
        au.raw_user_meta_data->>'last_name',
        au.raw_user_meta_data->>'shop_name',
        au.raw_user_meta_data->>'shop_adresse',
        COALESCE(au.raw_user_meta_data->>'profile', 'personal'),
        au.raw_user_meta_data->>'bio',
        au.raw_user_meta_data->>'social_facebook',
        au.raw_user_meta_data->>'social_x',
        au.raw_user_meta_data->>'social_linkedin',
        au.raw_user_meta_data->>'social_instagram',
        au.banned_until,
        au.raw_user_meta_data,
        NOW()
    FROM auth.users au
    WHERE au.id = user_id
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        confirmed_at = EXCLUDED.confirmed_at,
        last_sign_in_at = EXCLUDED.last_sign_in_at,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        shop_name = EXCLUDED.shop_name,
        shop_adresse = EXCLUDED.shop_adresse,
        profile = EXCLUDED.profile,
        bio = EXCLUDED.bio,
        social_facebook = EXCLUDED.social_facebook,
        social_x = EXCLUDED.social_x,
        social_linkedin = EXCLUDED.social_linkedin,
        social_instagram = EXCLUDED.social_instagram,
        banned_until = EXCLUDED.banned_until,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- ÉTAPE 3: Trigger automatique pour les nouveaux utilisateurs
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    PERFORM public.sync_user_to_public(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger pour les nouveaux utilisateurs
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- ÉTAPE 4: Trigger pour les mises à jour d'utilisateurs
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger AS $$
BEGIN
    -- Synchroniser uniquement si les métadonnées ont changé
    IF (NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data) OR
       (NEW.email IS DISTINCT FROM OLD.email) OR
       (NEW.phone IS DISTINCT FROM OLD.phone) OR
       (NEW.banned_until IS DISTINCT FROM OLD.banned_until) THEN
        PERFORM public.sync_user_to_public(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Créer le trigger pour les mises à jour
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_update();


-- ============================================================================
-- ÉTAPE 5: SYNCHRONISATION INITIALE - Copier tous les utilisateurs existants
-- ============================================================================
DO $$
DECLARE
    user_record RECORD;
    synced_count INTEGER := 0;
BEGIN
    FOR user_record IN SELECT id FROM auth.users LOOP
        PERFORM public.sync_user_to_public(user_record.id);
        synced_count := synced_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Synchronisation terminée: % utilisateurs synchronisés', synced_count;
END $$;


-- ============================================================================
-- ÉTAPE 6: Fonction pour forcer la resynchronisation (pour le bouton refresh)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.force_sync_all_users()
RETURNS TABLE(synced_count INTEGER) AS $$
DECLARE
    user_record RECORD;
    count INTEGER := 0;
BEGIN
    FOR user_record IN SELECT id FROM auth.users LOOP
        PERFORM public.sync_user_to_public(user_record.id);
        count := count + 1;
    END LOOP;
    
    RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
-- Compter les utilisateurs dans auth.users
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- Compter les utilisateurs dans public.users
SELECT COUNT(*) as public_users_count FROM public.users;

-- Afficher les utilisateurs synchronisés
SELECT 
    id,
    email,
    first_name,
    last_name,
    profile,
    created_at
FROM public.users
ORDER BY created_at DESC;
