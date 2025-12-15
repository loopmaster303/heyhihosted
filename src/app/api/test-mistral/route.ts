import { NextRequest, NextResponse } from 'next/server';
import { testMistralDirect } from '@/utils/test-mistral-direct';

export async function GET(request: NextRequest) {
    try {
        const result = await testMistralDirect();

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Mistral API test successful',
                data: {
                    modelsCount: result.models?.length || 0,
                    availableModels: result.models?.map((m: any) => m.id) || [],
                    chatTest: {
                        model: result.chatResponse?.model,
                        response: result.chatResponse?.choices?.[0]?.message?.content,
                        usage: result.chatResponse?.usage
                    }
                }
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error,
                message: 'Mistral API test failed'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Test API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            message: 'Test API failed'
        }, { status: 500 });
    }
}