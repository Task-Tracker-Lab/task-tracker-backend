import { CreateProjectUseCase } from './create-project.use-case';
import { DeleteProjectUseCase } from './delete-project.use-case';
import { GenerateShareTokenUseCase } from './generate-share-token.use-case';
import { SetProjectStatusUseCase } from './set-project-status.use-case';
import { UpdateProjectUseCase } from './update-project.use-case';
import { FindProjectsByTeamQuery } from './find-projects-by-team.query';
import { GetProjectDetailQuery } from './get-project-detail.query';
import { FindProjectQuery } from './find-project.query';

export * from './create-project.use-case';
export * from './delete-project.use-case';
export * from './generate-share-token.use-case';
export * from './set-project-status.use-case';
export * from './update-project.use-case';
export * from './find-projects-by-team.query';
export * from './get-project-detail.query';
export * from './find-project.query';

export const ProjectUseCases = [
    CreateProjectUseCase,
    DeleteProjectUseCase,
    GenerateShareTokenUseCase,
    SetProjectStatusUseCase,
    UpdateProjectUseCase,
];

export const ProjectQueries = [FindProjectsByTeamQuery, GetProjectDetailQuery, FindProjectQuery];
