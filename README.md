# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## FAL API setup

The experimental `/fal-test` page calls the FAL FLUX.1 Dev endpoint. Add one of the following to your environment before running the server or build:

```
FAL_KEY=your-key-id:your-key-secret
```

or

```
FAL_KEY_ID=your-key-id
FAL_KEY_SECRET=your-key-secret
```

You can create API keys in the [fal.ai dashboard](https://fal.ai/). Without credentials the API route will respond with a configuration error.
