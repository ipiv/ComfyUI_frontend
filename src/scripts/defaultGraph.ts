import type { ComfyWorkflowJSON } from '@/types/comfyWorkflow'

export const defaultGraph: ComfyWorkflowJSON = {
  state: {
    lastNodeId: 9,
    lastLinkId: 9
  },
  nodes: [
    {
      id: 7,
      type: 'CLIPTextEncode',
      pos: [413, 389],
      size: [425.27801513671875, 180.6060791015625],
      flags: {},
      order: 3,
      mode: 0,
      inputs: [{ name: 'clip', type: 'CLIP', link: 5 }],
      outputs: [
        {
          name: 'CONDITIONING',
          type: 'CONDITIONING',
          links: [6],
          slot_index: 0
        }
      ],
      properties: {},
      widgets_values: ['text, watermark']
    },
    {
      id: 6,
      type: 'CLIPTextEncode',
      pos: [415, 186],
      size: [422.84503173828125, 164.31304931640625],
      flags: {},
      order: 2,
      mode: 0,
      inputs: [{ name: 'clip', type: 'CLIP', link: 3 }],
      outputs: [
        {
          name: 'CONDITIONING',
          type: 'CONDITIONING',
          links: [4],
          slot_index: 0
        }
      ],
      properties: {},
      widgets_values: [
        'beautiful scenery nature glass bottle landscape, , purple galaxy bottle,'
      ]
    },
    {
      id: 5,
      type: 'EmptyLatentImage',
      pos: [473, 609],
      size: [315, 106],
      flags: {},
      order: 1,
      mode: 0,
      outputs: [{ name: 'LATENT', type: 'LATENT', links: [2], slot_index: 0 }],
      properties: {},
      widgets_values: [512, 512, 1]
    },
    {
      id: 3,
      type: 'KSampler',
      pos: [863, 186],
      size: [315, 262],
      flags: {},
      order: 4,
      mode: 0,
      inputs: [
        { name: 'model', type: 'MODEL', link: 1 },
        { name: 'positive', type: 'CONDITIONING', link: 4 },
        { name: 'negative', type: 'CONDITIONING', link: 6 },
        { name: 'latent_image', type: 'LATENT', link: 2 }
      ],
      outputs: [{ name: 'LATENT', type: 'LATENT', links: [7], slot_index: 0 }],
      properties: {},
      widgets_values: [156680208700286, true, 20, 8, 'euler', 'normal', 1]
    },
    {
      id: 8,
      type: 'VAEDecode',
      pos: [1209, 188],
      size: [210, 46],
      flags: {},
      order: 5,
      mode: 0,
      inputs: [
        { name: 'samples', type: 'LATENT', link: 7 },
        { name: 'vae', type: 'VAE', link: 8 }
      ],
      outputs: [{ name: 'IMAGE', type: 'IMAGE', links: [9], slot_index: 0 }],
      properties: {}
    },
    {
      id: 9,
      type: 'SaveImage',
      pos: [1451, 189],
      size: [210, 26],
      flags: {},
      order: 6,
      mode: 0,
      inputs: [{ name: 'images', type: 'IMAGE', link: 9 }],
      properties: {}
    },
    {
      id: 4,
      type: 'CheckpointLoaderSimple',
      pos: [26, 474],
      size: [315, 98],
      flags: {},
      order: 0,
      mode: 0,
      outputs: [
        { name: 'MODEL', type: 'MODEL', links: [1], slot_index: 0 },
        { name: 'CLIP', type: 'CLIP', links: [3, 5], slot_index: 1 },
        { name: 'VAE', type: 'VAE', links: [8], slot_index: 2 }
      ],
      properties: {},
      widgets_values: ['v1-5-pruned-emaonly.ckpt']
    }
  ],
  links: [
    {
      id: 1,
      origin_id: 4,
      origin_slot: 0,
      target_id: 3,
      target_slot: 0,
      type: 'MODEL'
    },
    {
      id: 2,
      origin_id: 5,
      origin_slot: 0,
      target_id: 3,
      target_slot: 3,
      type: 'LATENT'
    },
    {
      id: 3,
      origin_id: 4,
      origin_slot: 1,
      target_id: 6,
      target_slot: 0,
      type: 'CLIP'
    },
    {
      id: 4,
      origin_id: 6,
      origin_slot: 0,
      target_id: 3,
      target_slot: 1,
      type: 'CONDITIONING'
    },
    {
      id: 5,
      origin_id: 4,
      origin_slot: 1,
      target_id: 7,
      target_slot: 0,
      type: 'CLIP'
    },
    {
      id: 6,
      origin_id: 7,
      origin_slot: 0,
      target_id: 3,
      target_slot: 2,
      type: 'CONDITIONING'
    },
    {
      id: 7,
      origin_id: 3,
      origin_slot: 0,
      target_id: 8,
      target_slot: 0,
      type: 'LATENT'
    },
    {
      id: 8,
      origin_id: 4,
      origin_slot: 2,
      target_id: 8,
      target_slot: 1,
      type: 'VAE'
    },
    {
      id: 9,
      origin_id: 8,
      origin_slot: 0,
      target_id: 9,
      target_slot: 0,
      type: 'IMAGE'
    }
  ],
  groups: [],
  config: {},
  extra: {},
  version: 1
}

export const defaultGraphJSON = JSON.stringify(defaultGraph)

export const blankGraph: ComfyWorkflowJSON = {
  last_node_id: 0,
  last_link_id: 0,
  nodes: [],
  links: [],
  groups: [],
  config: {},
  extra: {},
  version: 0.4
}
