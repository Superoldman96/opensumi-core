import { ILogger, useInjectable } from '@ali/ide-core-browser';
import { ReactEditorComponent } from '@ali/ide-editor/lib/browser';
import { Markdown } from '@ali/ide-markdown';
import { observer } from 'mobx-react-lite';
import * as React from 'react';
import { ExtensionDetail, IExtensionManagerService } from '../common';
import * as clx from 'classnames';
import * as styles from './extension-detail.module.less';
import { IDialogService } from '@ali/ide-overlay';

export const ExtensionDetailView: ReactEditorComponent<null> = observer((props) => {
  const isLocal = props.resource.uri.authority === 'local';
  const { id: extensionId } = props.resource.uri.getParsedQuery();
  const [extension, setExtension] = React.useState<ExtensionDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [tabIndex, setTabIndex] = React.useState(0);
  const tabs = [{
    name: 'readme',
    displayName: 'Details',
  }, {
    name: 'changelog',
    displayName: 'Changelog',
  }];

  const extensionManagerService = useInjectable<IExtensionManagerService>(IExtensionManagerService);
  const dialogService = useInjectable<IDialogService>(IDialogService);
  const logger = useInjectable<ILogger>(ILogger);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const extension = isLocal
                    ? await extensionManagerService.getDetailById(extensionId)
                    : await extensionManagerService.getDetailFromMarketplace(extensionId);
        if (extension) {
          setExtension(extension);
        }
      } catch (err) {
        logger.error(err);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [extensionId]);

  function getContent(name: string, extension: ExtensionDetail) {
    switch (name) {
      case 'readme':
        return <Markdown content={extension.readme}/>;
      case 'changelog':
        return <Markdown content={extension.changelog}/>;
      default:
        return null;
    }
  }

  async function toggleActive() {
    if (extension) {
      const enable = !extension.enable;
      await extensionManagerService.toggleActiveExtension(extension.id, enable);
      setExtension({
        ...extension,
        enable,
      });
      const message = await dialogService.info('启用/禁用插件需要重启 IDE，你要现在重启吗？', ['稍后我自己重启', '是，现在重启']);
      if (message === '是，现在重启') {
        location.reload();
      }
    }
  }

  return (
    <div className={styles.wrap}>
      {extension && (
      <>
        <div className={styles.header}>
          <div>
            <img className={styles.icon} src={extension.icon}></img>
          </div>
          <div className={styles.details}>
            <div className={styles.title}>
              <span className={styles.name}>{extension.displayName}</span>
              <span className={styles.identifier}>{extension.showId}</span>
            </div>
            <div className={styles.subtitle}>
              <span className={styles.publisher}>{extension.publisher}</span>
            </div>
            <div className={styles.description}>{extension.description}</div>
            <div className={styles.actions}>
              {!isLocal && (
                <div>
                  <a className={clx({
                    [styles.enable]: extension.enable,
                  })} onClick={toggleActive}>安装</a>
                </div>
              )}
              {isLocal && (
                <div>
                  <a className={clx({
                    [styles.enable]: extension.enable,
                  })} onClick={toggleActive}>{extension.enable ? '禁用' : '启用'}</a>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={styles.body}>
          <div className={styles.navbar}>
            <ul className={styles.actions_container}>
              {tabs.map((tab, index) => (
                <li key={tab.name} className={styles.action_item}>
                  <a className={clx(styles.action_label, {
                    [styles.action_label_show]: index === tabIndex,
                  })} onClick={() => setTabIndex(index)}>{tab.displayName}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.content}>
            {tabs.map((tab, index) => (
              <div className={clx(styles.content_item, {
                [styles.content_item_show]: index === tabIndex,
              })}>{getContent(tab.name, extension)}</div>
            ))}
          </div>
        </div>
      </>
      )}
    </div>
  );
});
