import { Autowired, Injectable } from '@opensumi/di';
import { DisposableCollection, LifeCyclePhase } from '@opensumi/ide-core-common';
import { IMainLayoutService } from '@opensumi/ide-main-layout';
import { IIconService, IconType } from '@opensumi/ide-theme';

import { Contributes, LifeCycle, VSCodeContributePoint } from '../../../common';
import { AbstractExtInstanceManagementService } from '../../types';

type LocationKey = 'panel' | 'activitybar';

export type ViewContainersContribution = {
  [key in LocationKey]: ViewContainerItem;
};

export interface ViewContainerItem {
  id: string;
  title: string;
  icon: string;
}

export type ViewContainersSchema = Array<ViewContainersContribution>;

@Injectable()
@Contributes('viewsContainers')
@LifeCycle(LifeCyclePhase.Initialize)
export class ViewContainersContributionPoint extends VSCodeContributePoint<ViewContainersSchema> {
  @Autowired(IMainLayoutService)
  mainlayoutService: IMainLayoutService;

  @Autowired(IIconService)
  iconService: IIconService;

  @Autowired(AbstractExtInstanceManagementService)
  protected readonly extensionManageService: AbstractExtInstanceManagementService;

  private disposableCollection: DisposableCollection = new DisposableCollection();

  private convertLocationToSide(location: 'activitybar' | 'panel'): 'left' | 'bottom' {
    if (location === 'activitybar') {
      return 'left';
    }
    return 'bottom';
  }

  contribute() {
    for (const contrib of this.contributesMap) {
      const { extensionId, contributes } = contrib;
      const extension = this.extensionManageService.getExtensionInstanceByExtId(extensionId);
      if (!extension) {
        continue;
      }
      for (const location of Object.keys(contributes)) {
        const side = this.convertLocationToSide(location as LocationKey);
        for (const container of contributes[location]) {
          const handlerId = this.mainlayoutService.collectTabbarComponent(
            [],
            {
              iconClass: this.toIconClass(container.icon, IconType.Mask, extension.path),
              title: this.getLocalizeFromNlsJSON(container.title, extensionId),
              containerId: container.id,
              // 插件注册的视图默认在最后
              priority: 0,
              fromExtension: true,
              // 插件注册的视图容器无view时默认都隐藏tab
              hideIfEmpty: true,
              alignment: side === 'left' ? 'vertical' : 'horizontal',
            },
            side,
          );
          this.disposableCollection.push({
            dispose: () => {
              const handler = this.mainlayoutService.getTabbarHandler(handlerId);
              handler?.dispose();
            },
          });
        }
      }
    }
  }

  dispose() {
    this.disposableCollection.dispose();
  }

  getViewsMap(contributes: any) {
    const views = contributes.views;
    const map: { [containerId: string]: string[] } = {};
    if (views) {
      for (const containerId of Object.keys(views)) {
        if (views[containerId] && Array.isArray(views[containerId])) {
          map[containerId] = views[containerId].map((view) => view.id);
        }
      }
    }

    return map;
  }
}
