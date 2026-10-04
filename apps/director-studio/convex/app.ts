// Domain handlers are shared by the local workspace and the authenticated Type backend.
import { mutation, query } from "./typeFunctions";
import * as service from "../shared/studioService";

export const status = query({ args: service.statusArgs.fields, returns: service.statusReturns, handler: service.status });

export const listProjects = query({ args: service.listProjectsArgs.fields, returns: service.listProjectsReturns, handler: service.listProjects });

export const getProject = query({ args: service.getProjectArgs.fields, returns: service.getProjectReturns, handler: service.getProject });

export const getBrief = query({ args: service.getBriefArgs.fields, returns: service.getBriefReturns, handler: service.getBrief });

export const listBriefs = query({ args: service.listBriefsArgs.fields, returns: service.listBriefsReturns, handler: service.listBriefs });

export const createProject = mutation({ args: service.createProjectArgs.fields, returns: service.createProjectReturns, handler: service.createProject });

export const createProjectFromBrief = mutation({ args: service.createProjectFromBriefArgs.fields, returns: service.createProjectFromBriefReturns, handler: service.createProjectFromBrief });

export const upsertBrief = mutation({ args: service.upsertBriefArgs.fields, returns: service.upsertBriefReturns, handler: service.upsertBrief });

export const updateProject = mutation({ args: service.updateProjectArgs.fields, returns: service.updateProjectReturns, handler: service.updateProject });

export const updateScene = mutation({ args: service.updateSceneArgs.fields, returns: service.updateSceneReturns, handler: service.updateScene });

export const replaceScenes = mutation({ args: service.replaceScenesArgs.fields, returns: service.replaceScenesReturns, handler: service.replaceScenes });

export const deleteProject = mutation({ args: service.deleteProjectArgs.fields, returns: service.deleteProjectReturns, handler: service.deleteProject });
