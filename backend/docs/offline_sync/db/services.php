<?php
defined('MOODLE_INTERNAL') || die();

$functions = array(
    'local_offline_sync_create_module' => array(
        'classname'   => 'local_offline_sync_external',
        'methodname'  => 'create_module',
        'description' => 'Crée une activité ou ressource (assign, url, folder, resource)',
        'type'        => 'write',
        'ajax'        => true,
    )
);