<template>
  <SidebarTabTemplate
    :title="$t('sideToolbar.modelLibrary')"
    class="bg-[var(--p-tree-background)]"
  >
    <template #tool-buttons>
      <Button
        icon="pi pi-upload"
        @click="openUploadDialog"
        severity="secondary"
        text
        v-tooltip="$t('uploadModel')"
      />
      <Button
        icon="pi pi-refresh"
        @click="modelStore.loadModelFolders"
        severity="secondary"
        text
        v-tooltip="$t('refresh')"
      />
      <Button
        icon="pi pi-cloud-download"
        @click="modelStore.loadModels"
        severity="secondary"
        text
        v-tooltip="$t('loadAllFolders')"
      />
    </template>
    <template #header>
      <SearchBox
        class="model-lib-search-box p-4"
        v-model:modelValue="searchQuery"
        :placeholder="$t('searchModels') + '...'"
        @search="handleSearch"
      />
    </template>
    <template #body>
      <TreeExplorer
        class="model-lib-tree-explorer py-0"
        :roots="renderedRoot.children"
        v-model:expandedKeys="expandedKeys"
      >
        <template #node="{ node }">
          <ModelTreeLeaf :node="node" />
        </template>
      </TreeExplorer>
    </template>
  </SidebarTabTemplate>
  <div id="model-library-model-preview-container" />
  <Dialog
    v-model:visible="showUploadDialog"
    :modal="true"
    :header="$t('uploadModel')"
    class="p-dialog-model-upload"
  >
    <div class="upload-form p-4">
      <div class="mb-3">
        <label class="block mb-2">{{ $t('selectFolder') }}</label>
        <Dropdown
          v-model="selectedFolder"
          :options="availableFolders"
          optionLabel="label"
          class="w-full"
        />
      </div>
      <div class="mb-3">
        <label class="block mb-2">{{ $t('selectFiles') }}</label>
        <FileUpload
          v-model="selectedFiles"
          mode="basic"
          :multiple="true"
          accept=".ckpt,.safetensors,.pt,.bin,.pth,.yaml,.json"
          :maxFileSize="10000000000"
          :auto="false"
          chooseLabel="Browse"
          @select="onFileSelect"
          @uploader="uploadFiles"
          :customUpload="true"
        />
      </div>
      <div v-if="uploadProgress > 0 || uploading" class="mb-3">
        <label class="block mb-2">Upload Progress</label>
        <ProgressBar :value="uploadProgress" :class="{ uploading: uploading }">
          <template #value>
            {{ uploadStatus }}
          </template>
        </ProgressBar>
      </div>
    </div>
    <template #footer>
      <Button
        :label="$t('upload')"
        @click="uploadFiles"
        :loading="uploading"
        :disabled="!selectedFiles.length || !selectedFolder"
      />
      <Button
        :label="$t('cancel')"
        @click="closeUploadDialog"
        severity="secondary"
        text
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import SearchBox from '@/components/common/SearchBox.vue'
import TreeExplorer from '@/components/common/TreeExplorer.vue'
import SidebarTabTemplate from '@/components/sidebar/tabs/SidebarTabTemplate.vue'
import ModelTreeLeaf from '@/components/sidebar/tabs/modelLibrary/ModelTreeLeaf.vue'
import {
  ComfyModelDef,
  ModelFolder,
  ResourceState,
  useModelStore
} from '@/stores/modelStore'
import { useModelToNodeStore } from '@/stores/modelToNodeStore'
import { useSettingStore } from '@/stores/settingStore'
import { useTreeExpansion } from '@/hooks/treeHooks'
import type {
  RenderedTreeExplorerNode,
  TreeExplorerNode
} from '@/types/treeExplorerTypes'
import { computed, ref, watch, toRef, onMounted, nextTick } from 'vue'
import type { TreeNode } from 'primevue/treenode'
import { app } from '@/scripts/app'
import { buildTree } from '@/utils/treeUtil'
import Dialog from 'primevue/dialog'
import FileUpload from 'primevue/fileupload'
import Dropdown from 'primevue/dropdown'
import { useToastStore } from '@/stores/toastStore'
import { api } from '@/scripts/api'
import ProgressBar from 'primevue/progressbar'

interface DownloadModelStatus {
  status: 'in_progress' | 'completed' | 'error'
  filename: string
  progress_percentage: number
  message?: string
}

const modelStore = useModelStore()
const modelToNodeStore = useModelToNodeStore()
const settingStore = useSettingStore()
const toastStore = useToastStore()
const searchQuery = ref<string>('')
const expandedKeys = ref<Record<string, boolean>>({})
const { expandNode, toggleNodeOnEvent } = useTreeExpansion(expandedKeys)

const filteredModels = ref<ComfyModelDef[]>([])
const handleSearch = async (query: string) => {
  if (!query) {
    filteredModels.value = []
    expandedKeys.value = {}
    return
  }
  // Load all models to ensure we have the latest data
  await modelStore.loadModels()
  const search = query.toLocaleLowerCase()
  filteredModels.value = modelStore.models.filter((model: ComfyModelDef) => {
    return model.searchable.includes(search)
  })

  nextTick(() => {
    expandNode(root.value)
  })
}

type ModelOrFolder = ComfyModelDef | ModelFolder

const root = computed<TreeNode>(() => {
  const allNodes: ModelOrFolder[] = searchQuery.value
    ? filteredModels.value
    : [...modelStore.modelFolders, ...modelStore.models]
  return buildTree(allNodes, (modelOrFolder: ModelOrFolder) =>
    modelOrFolder.key.split('/')
  )
})

const renderedRoot = computed<TreeExplorerNode<ModelOrFolder>>(() => {
  const nameFormat = settingStore.get('Comfy.ModelLibrary.NameFormat')
  const fillNodeInfo = (node: TreeNode): TreeExplorerNode<ModelOrFolder> => {
    const children = node.children?.map(fillNodeInfo)
    const model: ComfyModelDef | null =
      node.leaf && node.data ? node.data : null
    const folder: ModelFolder | null =
      !node.leaf && node.data ? node.data : null

    return {
      key: node.key,
      label: model
        ? nameFormat === 'title'
          ? model.title
          : model.simplified_file_name
        : node.label,
      leaf: node.leaf,
      data: node.data,
      getIcon: () => {
        if (model) {
          return model.image ? 'pi pi-image' : 'pi pi-file'
        }
        if (folder) {
          return folder.state === ResourceState.Loading
            ? 'pi pi-spin pi-spinner'
            : 'pi pi-folder'
        }
        return 'pi pi-folder'
      },
      getBadgeText: () => {
        // Return null to apply default badge text
        // Return empty string to hide badge
        if (!folder) {
          return null
        }
        return folder.state === ResourceState.Loaded ? null : ''
      },
      children,
      draggable: node.leaf,
      handleClick: (
        node: RenderedTreeExplorerNode<ModelOrFolder>,
        e: MouseEvent
      ) => {
        if (node.leaf) {
          const provider = modelToNodeStore.getNodeProvider(model.directory)
          if (provider) {
            const node = app.addNodeOnGraph(provider.nodeDef, {
              pos: app.getCanvasCenter()
            })
            const widget = node.widgets.find(
              (widget) => widget.name === provider.key
            )
            if (widget) {
              widget.value = model.file_name
            }
          }
        } else {
          toggleNodeOnEvent(e, node)
        }
      }
    }
  }
  return fillNodeInfo(root.value)
})

watch(
  toRef(expandedKeys, 'value'),
  (newExpandedKeys) => {
    Object.entries(newExpandedKeys).forEach(([key, isExpanded]) => {
      if (isExpanded) {
        const folderPath = key.split('/').slice(1).join('/')
        if (folderPath && !folderPath.includes('/')) {
          // Trigger (async) load of model data for this folder
          modelStore.getLoadedModelFolder(folderPath)
        }
      }
    })
  },
  { deep: true }
)

onMounted(async () => {
  if (settingStore.get('Comfy.ModelLibrary.AutoLoadAll')) {
    await modelStore.loadModels()
  }
})

const showUploadDialog = ref(false)
const selectedFolder = ref<{ label: string; value: string } | null>(null)
const selectedFiles = ref([])
const uploading = ref(false)

const availableFolders = computed(() => {
  return modelStore.modelFolders.map((folder) => ({
    label: folder.key,
    value: folder.key
  }))
})

const openUploadDialog = () => {
  showUploadDialog.value = true
  selectedFiles.value = []
  selectedFolder.value = null
}

const closeUploadDialog = () => {
  showUploadDialog.value = false
  selectedFiles.value = []
  selectedFolder.value = null
}

const onFileSelect = (event: { files: File[] }) => {
  selectedFiles.value = event.files
}

const uploadProgress = ref(0)
const uploadStatus = ref('')
const currentUploadFile = ref('')

const updateUploadStatus = (progress: number, fileName: string) => {
  uploadProgress.value = progress
  if (progress === 100) {
    uploadStatus.value = `Processing ${fileName}...`
  } else {
    uploadStatus.value = `${progress.toFixed(1)}%`
  }
}

const uploadFiles = async () => {
  if (!selectedFiles.value.length || !selectedFolder.value) return
  try {
    uploading.value = true
    uploadProgress.value = 0
    toastStore.add({
      severity: 'info',
      summary: 'Upload started',
      detail: `Starting upload...`,
      life: 2000
    })

    for (const file of selectedFiles.value) {
      try {
        currentUploadFile.value = file.name
        updateUploadStatus(0, file.name)

        const status = await modelStore.uploadModel({
          file: file,
          folder: selectedFolder.value.value.split('/')[0]
        })

        if (status.status === 'completed') {
          updateUploadStatus(100, file.name)
          toastStore.add({
            severity: 'success',
            summary: 'Uploaded',
            detail: `Successfully uploaded ${file.name}`,
            life: 4000
          })
        } else if (status.status === 'error') {
          toastStore.addAlert(
            `Failed to upload ${file.name}: ${status.message}`
          )
        }
      } catch (error) {
        toastStore.addAlert(`Failed to upload ${file.name}: ${error.message}`)
      }
    }

    closeUploadDialog()
  } catch (error) {
    console.error('Upload failed:', error)
    toastStore.addAlert(`Upload failed: ${error.message}`)
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    uploadStatus.value = ''
    currentUploadFile.value = ''
  }
}

// Update progress event listener
onMounted(() => {
  api.addEventListener(
    'upload_progress',
    (event: CustomEvent<DownloadModelStatus>) => {
      const detail = event.detail
      if (detail.status === 'in_progress' && uploading.value) {
        updateUploadStatus(detail.progress_percentage, detail.filename)
      }
    }
  )
})
</script>

<style>
.p-dialog.p-dialog-model-upload {
  min-width: 400px;
}
.uploading {
  opacity: 0.8;
}
</style>
