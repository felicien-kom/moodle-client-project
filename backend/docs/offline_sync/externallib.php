<?php
defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');
require_once($CFG->dirroot . '/course/lib.php');

class local_offline_sync_external extends external_api {

    public static function create_module_parameters() {
        return new external_function_parameters(array(
            'courseid'   => new external_value(PARAM_INT, 'ID du cours'),
            'sectionnum' => new external_value(PARAM_INT, 'Numéro de la section (0, 1, 2...)'),
            'modname'    => new external_value(PARAM_PLUGIN, 'Type de module (ex: assign, url, folder, resource)'),
            'name'       => new external_value(PARAM_TEXT, 'Nom de l\'activité'),
            'intro'      => new external_value(PARAM_RAW, 'Description (HTML autorisé)', VALUE_DEFAULT, ''),
            'options'    => new external_multiple_structure(
                new external_single_structure(array(
                    'name'  => new external_value(PARAM_ALPHANUMEXT, 'Nom du paramètre (ex: externalurl)'),
                    'value' => new external_value(PARAM_RAW, 'Valeur du paramètre')
                )), 'Paramètres spécifiques au module', VALUE_DEFAULT, array()
            )
        ));
    }

    public static function create_module($courseid, $sectionnum, $modname, $name, $intro, $options) {
        global $DB, $CFG;

        // 1. Validation des paramètres et de la sécurité
        $params = self::validate_parameters(self::create_module_parameters(), array(
            'courseid' => $courseid, 'sectionnum' => $sectionnum, 'modname' => $modname,
            'name' => $name, 'intro' => $intro, 'options' => $options
        ));
        
        $context = context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('moodle/course:manageactivities', $context);

        // 2. Préparation du module de base
        $module = $DB->get_record('modules', array('name' => $params['modname']), '*', MUST_EXIST);
        
        // 3. Préparation des données de l'instance
        require_once($CFG->dirroot . '/mod/' . $params['modname'] . '/lib.php');
        
        $moddata = new stdClass();
        $moddata->course      = $params['courseid'];
        $moddata->name        = $params['name'];
        $moddata->intro       = $params['intro'];
        $moddata->introformat = FORMAT_HTML;
        $moddata->modulename  = $params['modname'];
        $moddata->section     = $params['sectionnum'];
        $moddata->visible     = 1;

        // Injection des options dynamiques transmises par le client
        foreach ($params['options'] as $opt) {
            
            // Traduction 1 : Fichiers joints du devoir
            if ($opt['name'] === 'introattachments_filemanager' || $opt['name'] === 'introattachments') {
                $moddata->introattachments = $opt['value'];
            }
            // Traduction 2 : Instructions de l'activité (Devoir)
            else if ($opt['name'] === 'activity') {
                $moddata->activity_editor = array(
                    'text'   => $opt['value'],
                    'format' => 1, // FORMAT_HTML
                    'itemid' => 0
                );
            }
            // Comportement standard pour le reste
            else {
                $moddata->{$opt['name']} = $opt['value'];
            }
        }

        // --- CORRECTIF POUR LE MODULE ASSIGN (DEVOIR) ---
        // Si c'est un devoir, on injecte les valeurs par défaut obligatoires de Moodle en BDD
        if ($params['modname'] === 'assign') {
            $defaults = array(
                // --- ACTIVATION DES SOUS-PLUGINS DE REMISE ---
                'assignsubmission_file_enabled'       => 1, // Active la remise de fichiers
                'assignsubmission_onlinetext_enabled' => 0, // Active la saisie de texte en ligne
                'assignsubmission_file_maxfiles'      => 5, // Nombre maximum de fichiers autorisés
                'assignsubmission_file_maxsizebytes'  => 0, // 0 = Limite globale du cours/site
                // ---------------------------------------------
                
                'requiresubmissionstatement'  => 0,
                'nosubmissions'               => 0,
                'cutoffdate'                  => 0,
                'gradingduedate'              => 0,
                'alwaysshowdescription'       => 1,
                'teamsubmission'              => 0,
                'requireallteammemberssubmit' => 0,
                'teamsubmissiongroupingid'    => 0,
                'blindmarking'                => 0,
                'hidegrader'                  => 0,
                'revealidentities'            => 1,
                'attemptreopenmethod'         => 'none',
                'maxattempts'                 => -1,
                'markingworkflow'             => 0,
                'markingallocation'           => 0,
                'sendnotifications'           => 0,
                'sendlatenotifications'       => 0,
                'sendstudentnotifications'    => 1,
                'preventsubmissionnotingroup' => 0,
                'timelimit'                   => 0
            );
            
            // Applique les valeurs par défaut si le client (l'app JS) ne les a pas envoyées
            foreach ($defaults as $key => $val) {
                if (!isset($moddata->{$key})) {
                    $moddata->{$key} = $val;
                }
            }
        }
        // ------------------------------------------------

        // 4. Création de l'instance et du course_module via les fonctions natives Moodle
        $addinstancefunction = $params['modname'] . '_add_instance';
        if (!function_exists($addinstancefunction)) {
            throw new moodle_exception('Fonction de création introuvable pour ce module.');
        }

        // Ajoute le module (cm) dans la base
        $cm = new stdClass();
        $cm->course  = $params['courseid'];
        $cm->module  = $module->id;
        $cm->visible = 1;
        $cm->section = 0; 
        $cmid = add_course_module($cm);
        $moddata->coursemodule = $cmid;

        // Ajoute l'instance (ex: dans la table mod_assign)
        $instanceid = $addinstancefunction($moddata, null);

        // Lie l'instance au module
        $DB->set_field('course_modules', 'instance', $instanceid, array('id' => $cmid));
        
        // Place le module dans la bonne section
        course_add_cm_to_section($params['courseid'], $cmid, $params['sectionnum']);
        rebuild_course_cache($params['courseid']);

        return array(
            'cmid' => $cmid,
            'instanceid' => $instanceid
        );
    }

    public static function create_module_returns() {
        return new external_single_structure(array(
            'cmid'       => new external_value(PARAM_INT, 'ID du course_module créé'),
            'instanceid' => new external_value(PARAM_INT, 'ID de l\'instance créée (ex: assign id)')
        ));
    }
}