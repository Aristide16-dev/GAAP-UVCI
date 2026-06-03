<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use PDO;
use Tests\TestCase;

class AuthRegistrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->createRegistrationTables();
    }

    public function test_administrateur_can_register(): void
    {
        $response = $this->postJson('/api/register', [
            'type' => 'administrateur',
            'user_log_adm' => 'admin_test',
            'user_pasw_adm' => 'password123',
            'ann_aca' => 2026,
            'rol_usr' => 'admin',
            'para_cal' => 1.5,
            'coef_niv' => 2,
            'taux_hor' => 2500,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Administrateur inscrit avec succes.')
            ->assertJsonPath('data.user_log_adm', 'admin_test');

        $admin = DB::table('administrateur')->where('user_log_adm', 'admin_test')->first();

        $this->assertNotNull($admin);
        $this->assertTrue(Hash::check('password123', $admin->user_pasw_adm));
    }

    public function test_secretaire_can_register(): void
    {
        $this->insertAdministrateur();

        $response = $this->postJson('/api/register', [
            'type' => 'secretaire',
            'user_log_sp' => 'sec_test',
            'user_log_adm' => 'admin_test',
            'user_pasw_sp' => 'password123',
            'nom_sp' => 'Kouassi',
            'pren_sp' => 'Awa',
            'email_sp' => 'awa.kouassi@example.test',
            'rol_sp' => 'secretaire',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Secretaire principal inscrit avec succes.')
            ->assertJsonPath('data.user_log_sp', 'sec_test');

        $secretaire = DB::table('secretaire_principal')->where('user_log_sp', 'sec_test')->first();

        $this->assertNotNull($secretaire);
        $this->assertTrue(Hash::check('password123', $secretaire->user_pasw_sp));
    }

    public function test_enseignant_can_register(): void
    {
        $this->insertAdministrateur();
        $this->insertSecretaire();
        $this->insertReferentiels();

        $response = $this->postJson('/api/register', [
            'type' => 'enseignant',
            'user_log_adm' => 'admin_test',
            'user_log_sp' => 'sec_test',
            'id_grade' => 1,
            'id_statut' => 1,
            'id_depart' => 1,
            'user_log_ens' => 'ens_test',
            'user_pasw_ens' => 'password123',
            'nom_ens' => 'Diaby',
            'pren_ens' => 'Moussa',
            'email_ens' => 'moussa.diaby@example.test',
            'tel_ens' => '0102030405',
            'taux_hor_ens' => 3000,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Enseignant inscrit avec succes.')
            ->assertJsonPath('data.user_log_ens', 'ens_test');

        $enseignant = DB::table('enseignants')->where('user_log_ens', 'ens_test')->first();

        $this->assertNotNull($enseignant);
        $this->assertTrue(Hash::check('password123', $enseignant->user_pasw_ens));
    }

    public function test_administrateur_can_login(): void
    {
        $this->insertAdministrateur();

        $response = $this->postJson('/api/login', [
            'type' => 'administrateur',
            'login' => 'admin_test',
            'password' => 'password123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Connexion reussie.')
            ->assertJsonPath('type', 'administrateur')
            ->assertJsonPath('data.user_log_adm', 'admin_test')
            ->assertJsonMissing(['user_pasw_adm' => true]);
    }

    public function test_administrateur_can_register_then_login(): void
    {
        $registerResponse = $this->postJson('/api/register', [
            'type' => 'administrateur',
            'user_log_adm' => 'admin_register_login',
            'user_pasw_adm' => 'password123',
            'ann_aca' => 2026,
            'rol_usr' => 'admin',
            'para_cal' => 1.5,
            'coef_niv' => 2,
            'taux_hor' => 2500,
        ]);

        $registerResponse
            ->assertCreated()
            ->assertJsonPath('message', 'Administrateur inscrit avec succes.')
            ->assertJsonPath('data.user_log_adm', 'admin_register_login');

        $loginResponse = $this->postJson('/api/login', [
            'type' => 'administrateur',
            'login' => 'admin_register_login',
            'password' => 'password123',
        ]);

        $loginResponse
            ->assertOk()
            ->assertJsonPath('message', 'Connexion reussie.')
            ->assertJsonPath('type', 'administrateur')
            ->assertJsonPath('data.user_log_adm', 'admin_register_login')
            ->assertJsonMissing(['user_pasw_adm' => true]);
    }

    public function test_secretaire_can_login(): void
    {
        $this->insertAdministrateur();
        $this->insertSecretaire();

        $response = $this->postJson('/api/login', [
            'type' => 'secretaire',
            'login' => 'sec_test',
            'password' => 'password123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Connexion reussie.')
            ->assertJsonPath('type', 'secretaire')
            ->assertJsonPath('data.user_log_sp', 'sec_test')
            ->assertJsonPath('data.email_sp', 'awa.kouassi@example.test')
            ->assertJsonMissing(['user_pasw_sp' => true]);
    }

    public function test_enseignant_can_login(): void
    {
        $this->insertAdministrateur();
        $this->insertSecretaire();
        $this->insertReferentiels();
        $this->insertEnseignant();

        $response = $this->postJson('/api/login', [
            'type' => 'enseignant',
            'login' => 'ens_test',
            'password' => 'password123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Connexion reussie.')
            ->assertJsonPath('type', 'enseignant')
            ->assertJsonPath('data.user_log_ens', 'ens_test')
            ->assertJsonPath('data.email_ens', 'moussa.diaby@example.test')
            ->assertJsonMissing(['user_pasw_ens' => true]);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $this->insertAdministrateur();

        $response = $this->postJson('/api/login', [
            'type' => 'administrateur',
            'login' => 'admin_test',
            'password' => 'wrong-password',
        ]);

        $response
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Identifiants invalides.');
    }

    private function createRegistrationTables(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            $this->createPostgresTemporaryRegistrationTables();

            return;
        }

        if (
            DB::connection()->getDriverName() === 'sqlite'
            && ! in_array('sqlite', PDO::getAvailableDrivers(), true)
        ) {
            $this->markTestSkipped('Le driver PDO SQLite n est pas installe.');
        }

        Schema::dropIfExists('enseignants');
        Schema::dropIfExists('secretaire_principal');
        Schema::dropIfExists('administrateur');
        Schema::dropIfExists('grade');
        Schema::dropIfExists('statut');
        Schema::dropIfExists('departement');

        Schema::create('grade', function (Blueprint $table): void {
            $table->id('id_grade');
            $table->string('lib_grade', 100);
        });

        Schema::create('statut', function (Blueprint $table): void {
            $table->id('id_statut');
            $table->string('lib_statut', 100);
        });

        Schema::create('departement', function (Blueprint $table): void {
            $table->id('id_depart');
            $table->string('lib_depart', 150);
        });

        Schema::create('administrateur', function (Blueprint $table): void {
            $table->string('user_log_adm', 50)->primary();
            $table->string('user_pasw_adm');
            $table->integer('ann_aca');
            $table->string('rol_usr', 50);
            $table->decimal('para_cal', 8, 2);
            $table->decimal('coef_niv', 8, 2);
            $table->decimal('taux_hor', 10, 2);
        });

        Schema::create('secretaire_principal', function (Blueprint $table): void {
            $table->string('user_log_sp', 50)->primary();
            $table->string('user_log_adm', 50);
            $table->string('user_pasw_sp');
            $table->string('nom_sp', 100);
            $table->string('pren_sp', 100);
            $table->string('email_sp', 150)->unique();
            $table->string('rol_sp', 50);
        });

        Schema::create('enseignants', function (Blueprint $table): void {
            $table->id('id_ens');
            $table->string('user_log_adm', 50);
            $table->string('user_log_sp', 50);
            $table->unsignedBigInteger('id_grade');
            $table->unsignedBigInteger('id_statut');
            $table->unsignedBigInteger('id_depart');
            $table->string('user_log_ens', 50)->unique();
            $table->string('user_pasw_ens');
            $table->string('nom_ens', 100);
            $table->string('pren_ens', 100);
            $table->string('email_ens', 150)->unique();
            $table->string('tel_ens', 20);
            $table->decimal('taux_hor_ens', 10, 2);
        });
    }

    private function createPostgresTemporaryRegistrationTables(): void
    {
        DB::statement('SET search_path TO pg_temp, public');

        DB::statement('DROP TABLE IF EXISTS pg_temp.enseignants');
        DB::statement('DROP TABLE IF EXISTS pg_temp.secretaire_principal');
        DB::statement('DROP TABLE IF EXISTS pg_temp.administrateur');
        DB::statement('DROP TABLE IF EXISTS pg_temp.grade');
        DB::statement('DROP TABLE IF EXISTS pg_temp.statut');
        DB::statement('DROP TABLE IF EXISTS pg_temp.departement');

        DB::statement('CREATE TEMP TABLE grade (
            id_grade INTEGER PRIMARY KEY,
            lib_grade VARCHAR(100) NOT NULL
        )');

        DB::statement('CREATE TEMP TABLE statut (
            id_statut INTEGER PRIMARY KEY,
            lib_statut VARCHAR(100) NOT NULL
        )');

        DB::statement('CREATE TEMP TABLE departement (
            id_depart INTEGER PRIMARY KEY,
            lib_depart VARCHAR(150) NOT NULL
        )');

        DB::statement('CREATE TEMP TABLE administrateur (
            user_log_adm VARCHAR(50) PRIMARY KEY,
            user_pasw_adm VARCHAR(255) NOT NULL,
            ann_aca INTEGER NOT NULL,
            rol_usr VARCHAR(50) NOT NULL,
            para_cal NUMERIC NOT NULL,
            coef_niv NUMERIC NOT NULL,
            taux_hor NUMERIC NOT NULL
        )');

        DB::statement('CREATE TEMP TABLE secretaire_principal (
            user_log_sp VARCHAR(50) PRIMARY KEY,
            user_log_adm VARCHAR(50) NOT NULL,
            user_pasw_sp VARCHAR(255) NOT NULL,
            nom_sp VARCHAR(100) NOT NULL,
            pren_sp VARCHAR(100) NOT NULL,
            email_sp VARCHAR(150) UNIQUE NOT NULL,
            rol_sp VARCHAR(50) NOT NULL
        )');

        DB::statement('CREATE TEMP TABLE enseignants (
            id_ens INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            user_log_adm VARCHAR(50) NOT NULL,
            user_log_sp VARCHAR(50) NOT NULL,
            id_grade INTEGER NOT NULL,
            id_statut INTEGER NOT NULL,
            id_depart INTEGER NOT NULL,
            user_log_ens VARCHAR(50) UNIQUE NOT NULL,
            user_pasw_ens VARCHAR(255) NOT NULL,
            nom_ens VARCHAR(100) NOT NULL,
            pren_ens VARCHAR(100) NOT NULL,
            email_ens VARCHAR(150) UNIQUE NOT NULL,
            tel_ens VARCHAR(20) NOT NULL,
            taux_hor_ens NUMERIC NOT NULL
        )');
    }

    private function insertAdministrateur(): void
    {
        DB::table('administrateur')->insert([
            'user_log_adm' => 'admin_test',
            'user_pasw_adm' => Hash::make('password123'),
            'ann_aca' => 2026,
            'rol_usr' => 'admin',
            'para_cal' => 1,
            'coef_niv' => 1,
            'taux_hor' => 2500,
        ]);
    }

    private function insertSecretaire(): void
    {
        DB::table('secretaire_principal')->insert([
            'user_log_sp' => 'sec_test',
            'user_log_adm' => 'admin_test',
            'user_pasw_sp' => Hash::make('password123'),
            'nom_sp' => 'Kouassi',
            'pren_sp' => 'Awa',
            'email_sp' => 'awa.kouassi@example.test',
            'rol_sp' => 'secretaire',
        ]);
    }

    private function insertReferentiels(): void
    {
        DB::table('grade')->insert(['id_grade' => 1, 'lib_grade' => 'Assistant']);
        DB::table('statut')->insert(['id_statut' => 1, 'lib_statut' => 'Permanent']);
        DB::table('departement')->insert(['id_depart' => 1, 'lib_depart' => 'Informatique']);
    }

    private function insertEnseignant(): void
    {
        DB::table('enseignants')->insert([
            'user_log_adm' => 'admin_test',
            'user_log_sp' => 'sec_test',
            'id_grade' => 1,
            'id_statut' => 1,
            'id_depart' => 1,
            'user_log_ens' => 'ens_test',
            'user_pasw_ens' => Hash::make('password123'),
            'nom_ens' => 'Diaby',
            'pren_ens' => 'Moussa',
            'email_ens' => 'moussa.diaby@example.test',
            'tel_ens' => '0102030405',
            'taux_hor_ens' => 3000,
        ]);
    }
}
