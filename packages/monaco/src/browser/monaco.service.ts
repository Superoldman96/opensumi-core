import { Autowired, INJECTOR_TOKEN, Injectable, Injector } from '@opensumi/di';
import {
  Disposable,
  ILogger,
  KeybindingRegistry,
  KeybindingService,
  MonacoOverrideServiceRegistry,
  ServiceNames,
  Uri,
} from '@opensumi/ide-core-browser';
import { IMergeEditorEditor } from '@opensumi/ide-core-browser/lib/monaco/merge-editor-widget';
import { IWorkspaceService } from '@opensumi/ide-workspace';
import { KeyCodeChord } from '@opensumi/monaco-editor-core/esm/vs/base/common/keybindings';
import { IEditorConstructionOptions } from '@opensumi/monaco-editor-core/esm/vs/editor/browser/config/editorConfiguration';
import {
  IDiffEditorConstructionOptions,
  MouseTargetType,
  isDiffEditor,
} from '@opensumi/monaco-editor-core/esm/vs/editor/browser/editorBrowser';
import { MultiDiffEditorWidget } from '@opensumi/monaco-editor-core/esm/vs/editor/browser/widget/multiDiffEditor/multiDiffEditorWidget';
import { IResourceLabelOptions } from '@opensumi/monaco-editor-core/esm/vs/editor/browser/widget/multiDiffEditor/workbenchUIElementFactory';
import { ShowLightbulbIconMode } from '@opensumi/monaco-editor-core/esm/vs/editor/common/config/editorOptions';
import { Range } from '@opensumi/monaco-editor-core/esm/vs/editor/editor.main';
import { IStandaloneEditorConstructionOptions } from '@opensumi/monaco-editor-core/esm/vs/editor/standalone/browser/standaloneCodeEditor';
import {
  StandaloneKeybindingService,
  StandaloneServices,
} from '@opensumi/monaco-editor-core/esm/vs/editor/standalone/browser/standaloneServices';

import { MonacoService } from '../common';

import { MergeEditorWidget } from './contrib/merge-editor/merge-editor-widget';
import { ResourceLabel } from './contrib/multi-diff-editor/resource-label';
import { ITextmateTokenizer, ITextmateTokenizerService } from './contrib/tokenizer';
import { monaco } from './monaco-api';
import { ICodeEditor, IDiffEditor } from './monaco-api/types';
import { MonacoResolvedKeybinding } from './monaco.resolved-keybinding';
// const SUMI_OVERFLOW_WIDGETS_CONTAINER_ID = 'sumi-overflow-widgets-container';
type IEditorType = IDiffEditor | ICodeEditor | IMergeEditorEditor;

@Injectable()
export default class MonacoServiceImpl extends Disposable implements MonacoService {
  @Autowired(INJECTOR_TOKEN)
  protected injector: Injector;

  @Autowired(ITextmateTokenizer)
  private textMateService: ITextmateTokenizerService;

  @Autowired(MonacoOverrideServiceRegistry)
  private readonly overrideServiceRegistry: MonacoOverrideServiceRegistry;

  @Autowired(KeybindingRegistry)
  private readonly keybindingRegistry: KeybindingRegistry;

  @Autowired(KeybindingService)
  protected readonly keybindingService: KeybindingService;

  @Autowired(IWorkspaceService)
  private readonly workspaceService: IWorkspaceService;

  @Autowired(ILogger)
  private readonly logger: ILogger;

  get monacoBaseOptions() {
    return {
      glyphMargin: true,
      lightbulb: {
        enabled: ShowLightbulbIconMode.OnCode,
      },
      model: undefined,
      wordBasedSuggestions: 'off',
      renderLineHighlight: 'none',
      automaticLayout: true,
      ignoreTrimWhitespace: false,
    } as IStandaloneEditorConstructionOptions;
  }

  public createCodeEditor(
    monacoContainer: HTMLElement,
    options?: IEditorConstructionOptions,
    overrides: { [key: string]: any } = {},
  ): ICodeEditor {
    const editor = monaco.editor.create(
      monacoContainer,
      {
        ...this.monacoBaseOptions,
        ...options,
      },
      {
        ...this.overrideServiceRegistry.all(),
        ...overrides,
      },
    );
    this.overrideMonacoKeybindingService(editor);

    this.addClickEventListener(editor);
    return editor;
  }

  private doAddClickEventListener(editor: ICodeEditor) {
    this.addDispose(
      editor.onMouseDown((e) => {
        if (e.target.type === MouseTargetType.GUTTER_LINE_NUMBERS) {
          const lineNumber = e.target.position?.lineNumber || e.target.range?.startLineNumber;
          if (!lineNumber) {
            return;
          }

          editor.setSelection(
            new Range(
              lineNumber,
              e.target.range?.startColumn || e.target.position?.column || 0,
              lineNumber + 1,
              e.target.range?.startColumn || e.target.position?.column || 0,
            ),
          );
        }
      }),
    );
  }

  private doAddCompositionEventListener(editor: ICodeEditor) {
    this.addDispose(
      editor.onDidCompositionStart((e) => {
        this.keybindingService?.handleCompositionStart();
      }),
    );
    this.addDispose(
      editor.onDidCompositionEnd((e) => {
        this.keybindingService?.handleCompositionEnd();
      }),
    );
  }

  private addClickEventListener(editor: IEditorType) {
    if (isDiffEditor(editor)) {
      const originalEditor = editor.getOriginalEditor();
      const modifiedEditor = editor.getModifiedEditor();

      this.doAddClickEventListener(originalEditor);
      this.doAddClickEventListener(modifiedEditor);
    } else {
      this.doAddClickEventListener(editor as ICodeEditor);
      this.doAddCompositionEventListener(editor as ICodeEditor);
    }
  }

  public createDiffEditor(
    monacoContainer: HTMLElement,
    options?: IDiffEditorConstructionOptions,
    overrides: { [key: string]: any } = {},
  ): IDiffEditor {
    const editor = monaco.editor.createDiffEditor(
      monacoContainer,
      {
        ...this.monacoBaseOptions,
        ...options,
      } as any,
      { ...this.overrideServiceRegistry.all(), ...overrides },
    );
    this.overrideMonacoKeybindingService(editor);
    this.addClickEventListener(editor);
    return editor;
  }

  createMultiDiffEditorWidget(
    monacoContainer: HTMLElement,
    options?: IDiffEditorConstructionOptions,
    overrides: { [key: string]: any } = {},
  ): MultiDiffEditorWidget {
    const instantiationService = StandaloneServices.initialize({
      ...this.overrideServiceRegistry.all(),
      ...overrides,
    });
    const editorWidget = new MultiDiffEditorWidget(
      monacoContainer,
      {
        createResourceLabel: (element: HTMLElement) => {
          const resourceLabel = new ResourceLabel(element);
          return {
            setUri: (uri: Uri, options?: IResourceLabelOptions) => {
              if (!uri) {
                resourceLabel.clear();
              } else {
                resourceLabel.setUri(uri, this.workspaceService, options);
              }
            },
            dispose: () => {},
          };
        },
      },
      instantiationService,
    );
    // this.overrideMonacoKeybindingService(editor);
    // this.addClickEventListener(editor);
    return editorWidget;
  }

  public createMergeEditor(
    monacoContainer: HTMLElement,
    options?: IDiffEditorConstructionOptions,
    overrides: { [key: string]: any } = {},
  ): IMergeEditorEditor {
    return this.injector.get(MergeEditorWidget, [
      monacoContainer,
      options,
      { ...this.overrideServiceRegistry.all(), ...overrides },
    ]);
  }

  private overrideMonacoKeybindingService(editor: IEditorType) {
    this.overrideKeybindingResolver(editor);
  }

  /**
   * 重载 Monaco 中 `_standaloneKeybindingService` 对应处理快捷键及快捷键事件的方法
   * @param editor
   */
  private overrideKeybindingResolver(editor: IEditorType) {
    const keybindingService = editor['_standaloneKeybindingService'] as StandaloneKeybindingService;
    if (!keybindingService) {
      return;
    }
    keybindingService.resolveKeybinding = (keybinding) => [
      new MonacoResolvedKeybinding(MonacoResolvedKeybinding.keySequence(keybinding), this.keybindingRegistry),
    ];
    keybindingService.resolveKeyboardEvent = (keyboardEvent) => {
      const keybinding = new KeyCodeChord(
        keyboardEvent.ctrlKey,
        keyboardEvent.shiftKey,
        keyboardEvent.altKey,
        keyboardEvent.metaKey,
        keyboardEvent.keyCode,
      ).toKeybinding();
      return new MonacoResolvedKeybinding(MonacoResolvedKeybinding.keySequence(keybinding), this.keybindingRegistry);
    };
  }

  public registerOverride(serviceName: ServiceNames, service: any) {
    this.logger.warn(
      true,
      'MonacoService#getOverride will be deprecated, please use MonacoOverrideServiceRegistry#getRegisteredService instead.',
    );
    this.overrideServiceRegistry.registerOverrideService(serviceName, service);
  }

  public getOverride(serviceName: ServiceNames) {
    this.logger.warn(
      true,
      'MonacoService#getOverride will be deprecated, please use MonacoOverrideServiceRegistry#getRegisteredService instead.',
    );
    return this.overrideServiceRegistry.getRegisteredService(serviceName);
  }

  public testTokenize(text: string, languageId: string) {
    this.textMateService.testTokenize(text, languageId);
  }
}
