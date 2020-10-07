'use strict';

const core = require('@actions/core');
const getenv = require('getenv');
const { Toolkit } = require('actions-toolkit');

const permissions = ['none', 'read', 'write', 'admin'];
const tools = new Toolkit();

const checkPermission = async function() {
  if (getenv.bool('ADD_TEST_PERMISSION', false)) {
    permissions.push('test-only-superuser');
  }

  try {
    const requiredPermission = core.getInput('required-permission');
    core.debug(`Required permission: ${requiredPermission}`);


    core.info(`User name: ${tools.context.actor}`);

    const payload = await tools.github.repos.getCollaboratorPermissionLevel({
      ...tools.context.repo,
      username: tools.context.actor
    });

    // This prints a lot of data
    // core.info(`Actor payload: ${JSON.stringify(payload)}`);
    core.info(`User permission!!!: ${ payload.data.permission }`);

    const payloadTeams = await tools.github.teams.listForAuthenticatedUser()
    core.info(`Authenticated user teams: ${JSON.stringify(payloadTeams)}`);

    if (permissions.indexOf(requiredPermission) < 0) {
      core.setFailed(`Required permission must be one of: ${permissions.toString()}`);
      return '';
    }


    if (!payload || !payload.data || !payload.data.permission) {
      core.debug(`No user permission found in payload: ${JSON.stringify(payload, null, 2)}`);
      return '';
    }

    const userPermission = payload.data.permission;
    core.debug(`User permission: ${userPermission}`);

    // Return true, if required level is equal or less than actual permission
    const isSufficient = permissions.indexOf(requiredPermission) <= permissions.indexOf(userPermission);
    core.debug(`Is sufficient: ${isSufficient}`);

    return isSufficient ? '1' : '';
  } catch (ex) {
    core.debug(`Exception: ${ex.message}`);
    return '';
  }
};

module.exports = checkPermission;
