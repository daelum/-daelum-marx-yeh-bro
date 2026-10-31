/// <reference types="astro/client" />

interface ImportMetaEnv {
	/** Amazon Associates AU tracking ID — one paste activates all /go/*-amz hops */
	readonly PUBLIC_AMZ_ASSOCIATE_TAG?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
